import * as THREE from "three";
import { CONSTELLATIONS, CONSTELLATION_BY_SLUG, KNOWN_STAR_BY_SLUG } from "../../../sistema_solar/data.js";
import { getGlowTexture } from "../../../sistema_solar/star-renderer.js";
import { baseLocal } from "../../../sistema_solar/universe/sky.js";
import { crearReloj } from "@explora/compartido/tiempo.js";
import { liberarEscena, } from "@explora/compartido/desmontar.js";

/* El mapa celeste: las 88 constelaciones dibujadas con sus estrellas reales.

   Copiado de sistema_solar/constellations-view.js. La cámara está en el centro
   de la esfera y gira sobre sí misma —el cielo se mira desde dentro— con el
   ecuador celeste, el meridiano y la retícula dibujados en el mismo espacio 3D,
   no como interfaz superpuesta: al girar, todo se mueve solidariamente.

   Igual que las otras vistas, avisa por callback de qué se ha pulsado y no sabe
   nada del panel que lo cuenta. */

const RADIO = 90;

/* Cuánto se encoge la figura proyectada al pegarla en la esfera. La constante es
   del dibujo, no de los datos: points.x/y vienen en grados de cielo y aquí se
   decide cuánto ocupa un grado. El encuadre la usa también, así que el zoom no
   puede desajustarse de lo que se ve. */
const ESCALA_PROYECCION = .032;

export function montarConstelaciones(contenedor, { alElegirFigura, alElegirEstrella } = {}) {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x020617);

  const ancho = () => contenedor.clientWidth || 1;
  const alto = () => contenedor.clientHeight || 1;

  const camara = new THREE.PerspectiveCamera(76, ancho() / alto(), .01, 1400);
  camara.position.set(0, 0, 0);
  camara.rotation.order = "YXZ";

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(ancho(), alto());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  contenedor.appendChild(renderer.domElement);

  escena.add(new THREE.AmbientLight(0xdbeafe, .9));
  const cielo = new THREE.Group();
  escena.add(cielo);

  const raycaster = new THREE.Raycaster();
  raycaster.params.Line.threshold = .7;
  const puntero = new THREE.Vector2();

  let activa = null, pulsables = [];
  let arrastrando = false, movido = false, ultimoX = 0, ultimoY = 0;
  let fovObjetivo = 76, giroObjetivo = 0, alturaObjetivo = 0, ladeoObjetivo = 0;

  const posicionCeleste = (raHoras, decGrados, r = RADIO) => {
    const ra = raHoras / 24 * Math.PI * 2, dec = THREE.MathUtils.degToRad(decGrados);
    return new THREE.Vector3(
      Math.cos(dec) * Math.sin(ra), Math.sin(dec), -Math.cos(dec) * Math.cos(ra)
    ).multiplyScalar(r);
  };

  /* La base la calcula universe/sky.js, que es donde se puede probar que el
     norte apunta al norte: aquí solo se traduce a vectores. */
  function base(figura) {
    const b = baseLocal(figura.ra, figura.dec);
    return {
      center: new THREE.Vector3(...b.center),
      east: new THREE.Vector3(...b.east),
      north: new THREE.Vector3(...b.north)
    };
  }
  function puntoLocal(figura, punto) {
    const b = base(figura);
    return b.center.clone()
      .add(b.east.clone().multiplyScalar(punto.x * ESCALA_PROYECCION))
      .add(b.north.clone().multiplyScalar(punto.y * ESCALA_PROYECCION))
      .normalize().multiplyScalar(RADIO);
  }

  /* Campo de visión que deja la figura encuadrada. Antes era fijo para todas:
     la Cruz del Sur, que abarca 7° de cielo, quedaba como un punto, y la Hidra,
     que abarca 128°, no cabía. El límite inferior existe porque hay figuras
     diminutas —la del Microscopio son dos estrellas separadas 0,7°— y
     encuadrarlas de verdad dejaría un cielo vacío sin referencias. */
  const fovParaEncuadrar = figura => THREE.MathUtils.clamp(
    Math.atan((figura.spanPlano || 1) * ESCALA_PROYECCION) * 180 / Math.PI * 2 / .55, 12, 96
  );

  function rotulo(texto, escala = .34, color = "rgba(248,250,252,.82)") {
    const lienzo = document.createElement("canvas");
    lienzo.width = 512; lienzo.height = 128;
    const ctx = lienzo.getContext("2d");
    ctx.fillStyle = color; ctx.font = "800 34px Inter, sans-serif";
    ctx.fillText(texto.toUpperCase(), 18, 76);
    const textura = new THREE.CanvasTexture(lienzo);
    textura.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, transparent: true, depthWrite: false }));
    sprite.scale.set(escala * 9, escala * 2.1, 1);
    return sprite;
  }
  const marcar = (objeto, figura, punto = null, papel = "figura") => {
    objeto.userData = { figura, punto, papel };
    pulsables.push(objeto);
  };

  // Fondo: estrellas repartidas y la banda de la Vía Láctea.
  {
    const cuantas = 8200, posiciones = new Float32Array(cuantas * 3);
    for (let i = 0; i < cuantas; i++) {
      const ra = Math.random() * 24;
      const dec = THREE.MathUtils.radToDeg(Math.asin(Math.random() * 2 - 1));
      const p = posicionCeleste(ra, dec, RADIO * .995);
      posiciones.set([p.x, p.y, p.z], i * 3);
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
    cielo.add(new THREE.Points(geometria, new THREE.PointsMaterial({
      color: 0xffffff, size: .12, map: getGlowTexture(), transparent: true, opacity: .72, depthWrite: false
    })));
  }
  {
    const cuantas = 5200, posiciones = new Float32Array(cuantas * 3), colores = new Float32Array(cuantas * 3);
    for (let i = 0; i < cuantas; i++) {
      const p = posicionCeleste(i / cuantas * 24, Math.sin(i * .035) * 9 + (Math.random() - .5) * 10, RADIO * .99);
      posiciones.set([p.x, p.y, p.z], i * 3);
      colores.set([.62, .78, 1], i * 3);
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
    geometria.setAttribute("color", new THREE.BufferAttribute(colores, 3));
    cielo.add(new THREE.Points(geometria, new THREE.PointsMaterial({
      size: .24, map: getGlowTexture(), vertexColors: true, transparent: true,
      opacity: .32, blending: THREE.AdditiveBlending, depthWrite: false
    })));
  }

  const circulo = (puntos, material) => cielo.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntos), material));

  // Retícula y guías: el ecuador celeste en azul y el meridiano en verde.
  for (let dec = -60; dec <= 60; dec += 30) {
    const puntos = Array.from({ length: 241 }, (_, i) => posicionCeleste(i / 240 * 24, dec, RADIO * .998));
    circulo(puntos, new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: .12 }));
  }
  for (let h = 0; h < 24; h += 2) {
    const puntos = [];
    for (let d = -88; d <= 88; d += 2) puntos.push(posicionCeleste(h, d, RADIO * .997));
    circulo(puntos, new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: .08 }));
  }
  circulo(Array.from({ length: 481 }, (_, i) => posicionCeleste(i / 480 * 24, 0, RADIO * 1.002)),
    new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: .9 }));
  [-45, 45].forEach(dec => circulo(
    Array.from({ length: 241 }, (_, i) => posicionCeleste(i / 240 * 24, dec, RADIO * 1.001)),
    new THREE.LineBasicMaterial({ color: dec > 0 ? 0x93c5fd : 0xa78bfa, transparent: true, opacity: .2 })
  ));
  circulo(Array.from({ length: 241 }, (_, i) => {
    const a = i / 240 * Math.PI * 2;
    return new THREE.Vector3(0, Math.sin(a), -Math.cos(a)).multiplyScalar(RADIO * 1.004);
  }), new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: .88 }));
  [
    { texto: "ECUADOR CELESTE", ra: 0, dec: 0, escala: .34, color: "rgba(125,211,252,.96)" },
    { texto: "MERIDIANO N-S", ra: 0, dec: 12, escala: .28, color: "rgba(134,239,172,.94)" },
    { texto: "CENIT 90°", ra: 0, dec: 84, escala: .3, color: "rgba(220,252,231,.96)" },
    { texto: "NORTE", ra: 1.5, dec: 76, escala: .3, color: "rgba(191,219,254,.94)" },
    { texto: "SUR", ra: 13.5, dec: -76, escala: .3, color: "rgba(221,214,254,.94)" }
  ].forEach(guia => {
    const sprite = rotulo(guia.texto, guia.escala, guia.color);
    sprite.position.copy(posicionCeleste(guia.ra, guia.dec, RADIO * .92));
    cielo.add(sprite);
  });

  // Las 88 figuras, con sus estrellas reales.
  CONSTELLATIONS.forEach(figura => {
    const porId = new Map(figura.points.map(punto => [punto.id, punto]));
    figura.lines.forEach(([a, b]) => {
      const pa = porId.get(a), pb = porId.get(b);
      if (!pa || !pb) return;
      const linea = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([puntoLocal(figura, pa), puntoLocal(figura, pb)]),
        new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: .42 })
      );
      marcar(linea, figura, null, "linea");
      cielo.add(linea);
    });
    figura.points.forEach(punto => {
      const datos = punto.starSlug ? KNOWN_STAR_BY_SLUG[punto.starSlug] : null;
      const posicion = puntoLocal(figura, punto);
      const tamaño = (punto.size || .18) * .76;
      const estrella = new THREE.Mesh(
        new THREE.SphereGeometry(tamaño, 16, 16),
        new THREE.MeshBasicMaterial({
          color: punto.color || datos?.color || 0xffffff,
          transparent: true, opacity: .94, blending: THREE.AdditiveBlending
        })
      );
      estrella.position.copy(posicion);
      marcar(estrella, figura, punto, "estrella");
      cielo.add(estrella);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: getGlowTexture(), color: punto.color || datos?.color || 0xffffff,
        transparent: true, opacity: .2, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      halo.position.copy(posicion);
      halo.scale.set(tamaño * 5, tamaño * 5, 1);
      marcar(halo, figura, punto, "halo");
      cielo.add(halo);
    });
    const nombre = rotulo(figura.name, .22);
    nombre.position.copy(posicionCeleste(figura.ra, figura.dec, RADIO * .92));
    marcar(nombre, figura, null, "nombre");
    cielo.add(nombre);
  });

  const diferenciaDeAngulo = (desde, hasta) => {
    let d = (hasta - desde + Math.PI) % (Math.PI * 2) - Math.PI;
    return d < -Math.PI ? d + Math.PI * 2 : d;
  };

  function enfocar(slug) {
    const figura = CONSTELLATION_BY_SLUG[slug];
    if (!figura) return;
    activa = figura;
    giroObjetivo += diferenciaDeAngulo(giroObjetivo, -(figura.ra / 24 * Math.PI * 2));
    alturaObjetivo = THREE.MathUtils.degToRad(figura.dec);
    /* El zoom se calcula, no se hereda: antes solo sabía cerrarse, así que al
       pasar de la Hidra a la Cruz del Sur se quedaba con el encuadre anterior. */
    fovObjetivo = fovParaEncuadrar(figura);
    alElegirFigura?.(slug);
  }

  function verTodo() {
    activa = null;
    giroObjetivo = 0; alturaObjetivo = 0; ladeoObjetivo = 0; fovObjetivo = 76;
    alElegirFigura?.(null);
  }

  const zoom = delta => { fovObjetivo = THREE.MathUtils.clamp(fovObjetivo + delta, 12, 104); };

  const alPulsarAbajo = evento => {
    if (evento.target !== renderer.domElement) return;
    arrastrando = true; movido = false;
    ultimoX = evento.clientX; ultimoY = evento.clientY;
  };
  const alMover = evento => {
    if (!arrastrando) return;
    const dx = evento.clientX - ultimoX, dy = evento.clientY - ultimoY;
    movido = movido || Math.abs(dx) + Math.abs(dy) > 4;
    if (evento.shiftKey) ladeoObjetivo += dx * .006;
    else { giroObjetivo -= dx * .004; alturaObjetivo -= dy * .004; }
    ultimoX = evento.clientX; ultimoY = evento.clientY;
  };
  const alSoltar = evento => {
    if (!arrastrando) return;
    arrastrando = false;
    if (movido) return;
    const caja = renderer.domElement.getBoundingClientRect();
    puntero.x = (evento.clientX - caja.left) / caja.width * 2 - 1;
    puntero.y = -((evento.clientY - caja.top) / caja.height) * 2 + 1;
    raycaster.setFromCamera(puntero, camara);
    const aciertos = raycaster.intersectObjects(pulsables);
    if (!aciertos.length) return;
    const { figura, punto } = aciertos[0].object.userData;
    /* Pulsar una estrella abre su ficha; pulsar el trazo o el nombre de la
       constelación la enfoca, que es lo mismo que pedir «llévame a Orión». */
    if (punto) { activa = figura; alElegirEstrella?.({ figura: figura.slug, punto }); }
    else enfocar(figura.slug);
  };
  const alGirarRueda = evento => {
    evento.preventDefault();
    zoom(THREE.MathUtils.clamp(evento.deltaY, -180, 180) * .045);
  };
  const alTeclear = evento => {
    if (evento.key.toLowerCase() === "q") ladeoObjetivo -= .08;
    if (evento.key.toLowerCase() === "e") ladeoObjetivo += .08;
  };

  window.addEventListener("pointerdown", alPulsarAbajo);
  window.addEventListener("pointermove", alMover);
  window.addEventListener("pointerup", alSoltar);
  renderer.domElement.addEventListener("wheel", alGirarRueda, { passive: false });
  window.addEventListener("keydown", alTeclear);

  const observador = new ResizeObserver(() => {
    camara.aspect = ancho() / alto();
    camara.updateProjectionMatrix();
    renderer.setSize(ancho(), alto());
  });
  observador.observe(contenedor);

  const reloj = crearReloj();
  let cuadro = null, vivo = true;
  function animar(ms) {
    if (!vivo) return;
    const tiempo = ms * .001, { avance } = reloj.paso(ms);
    /* El suavizado va por tiempo y no por cuadro: a 60 Hz la cámara tardaba el
       doble en llegar a la constelación elegida que a 120. */
    const paso = 1 - Math.pow(1 - .12, avance);
    const enfoque = THREE.MathUtils.clamp((76 - camara.fov) / 42, 0, 1);
    camara.rotation.x = THREE.MathUtils.lerp(camara.rotation.x, alturaObjetivo, paso);
    camara.rotation.y = THREE.MathUtils.lerp(camara.rotation.y, giroObjetivo, paso);
    camara.rotation.z = THREE.MathUtils.lerp(camara.rotation.z, ladeoObjetivo, paso);
    camara.fov = THREE.MathUtils.lerp(camara.fov, fovObjetivo, paso);
    camara.updateProjectionMatrix();

    pulsables.forEach((hijo, indice) => {
      if (!hijo.material) return;
      const { figura, papel } = hijo.userData;
      const esActiva = activa && figura.slug === activa.slug;
      let opacidad = .16;
      if (papel === "nombre") opacidad = .2 + enfoque * .18;
      if (papel === "linea") opacidad = .3;
      if (papel === "estrella") opacidad = .58;
      if (esActiva) {
        if (papel === "nombre") opacidad = .88;
        else if (papel === "linea") opacidad = .82;
        else if (papel === "estrella") opacidad = .96;
        else opacidad = .4;
      }
      if (hijo.isSprite && hijo.userData.punto) opacidad += Math.sin(tiempo * 2 + indice) * .035;
      hijo.material.opacity = THREE.MathUtils.clamp(opacidad, 0, .96);
    });

    renderer.render(escena, camara);
    cuadro = requestAnimationFrame(animar);
  }
  cuadro = requestAnimationFrame(animar);

  return {
    enfocar, verTodo, zoom,
    desmontar() {
      if (!vivo) return;
      vivo = false;
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      window.removeEventListener("pointerdown", alPulsarAbajo);
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerup", alSoltar);
      window.removeEventListener("keydown", alTeclear);
      renderer.domElement.removeEventListener("wheel", alGirarRueda);
      liberarEscena(escena);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      pulsables = [];
    }
  };
}
