import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BODY_DATA } from "../../../sistema_solar/data.js";
import { createBodyMesh, createSaturnRings, createSunGlow } from "../../../sistema_solar/body-renderer.js";
import { addStarfield } from "../../../sistema_solar/starfield.js";
import { crearReloj } from "@explora/compartido/tiempo.js";
import { liberarEscena } from "@explora/compartido/desmontar.js";
import { conRutasDeTextura } from "../datos/texturas.js";

/* La escala planetaria: los cuerpos por tamaño relativo, en fila.

   Copiada de sistema_solar/solar-scale.js. Todo lo que decide cómo se ve está
   igual: las posiciones de la fila, la unidad de 0,68 unidades por radio
   terrestre, el Sol con la suya más pequeña para que no se coma el cuadro, la
   cámara en (16,20,142) mirando a (10,0,0), la niebla, las luces y el cielo de
   fondo en dos capas.

   Lo que cambia es de quién depende: antes escribía en el HTML de su página y
   ahora avisa por callback de qué cuerpo se ha elegido, para que el panel lo
   pinte React. La escena no sabe qué es una ficha. */

const RADIO_RELATIVO = {
  sun: 109, mercury: .383, venus: .949, earth: 1, moon: .2724,
  mars: .532, jupiter: 11.21, saturn: 9.45, uranus: 4.01, neptune: 3.88
};

/* Unidad de los planetas: cuántas unidades de escena mide un radio terrestre.
   El Sol usa la suya, más pequeña, porque con esta se saldría del todo. */
const UNIDAD = .68;

/* La Luna no está en la fila: la fila compara planetas y ella es un satélite.
   Orbita a la Tierra, con su tamaño a escala y su distancia no —a escala real
   orbitaría más allá de Neptuno—. */
const FILA = [
  { slug: "sun", x: -70, unidad: .37, rotulo: 18 },
  { slug: "mercury", x: -22, unidad: UNIDAD, rotulo: 2.8 },
  { slug: "venus", x: -17, unidad: UNIDAD, rotulo: 3.3 },
  { slug: "earth", x: -12.4, unidad: UNIDAD, rotulo: 3.5 },
  { slug: "mars", x: -7.2, unidad: UNIDAD, rotulo: 3.0 },
  { slug: "jupiter", x: 5, unidad: UNIDAD, rotulo: 8.6 },
  { slug: "saturn", x: 31, unidad: UNIDAD, rotulo: 8.0 },
  { slug: "uranus", x: 50, unidad: UNIDAD, rotulo: 5.1 },
  { slug: "neptune", x: 60, unidad: UNIDAD, rotulo: 5 }
];
const RADIO_ORBITA_LUNA = 2.4;
const VELOCIDAD_ORBITA_LUNA = Math.PI * 2 / 40;   // una vuelta cada 40 s

export const RADIOS = RADIO_RELATIVO;

export function montarEscalaPlanetaria(contenedor, { alElegir } = {}) {
  const escena = new THREE.Scene();
  escena.fog = new THREE.FogExp2(0x020617, 0.0011);

  const ancho = () => contenedor.clientWidth || 1;
  const alto = () => contenedor.clientHeight || 1;

  const camara = new THREE.PerspectiveCamera(50, ancho() / alto(), 0.01, 5000);
  camara.position.set(16, 20, 142);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(ancho(), alto());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  contenedor.appendChild(renderer.domElement);

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.enableZoom = false;   // el zoom lo lleva la rueda, con inercia
  controles.minDistance = 2;
  controles.maxDistance = 380;
  controles.target.set(10, 0, 0);

  escena.add(new THREE.AmbientLight(0x8fb3ff, .58));
  const principal = new THREE.PointLight(0xffffff, 4.2, 0, 2);
  principal.position.set(-30, 18, 24);
  escena.add(principal);
  const relleno = new THREE.DirectionalLight(0x7dd3fc, .7);
  relleno.position.set(20, 12, -16);
  escena.add(relleno);

  /* Radios ajustados a la niebla de esta escena: más allá de unas 800 unidades
     no se ve nada, así que las capas del cielo se acercan. */
  const cielo = addStarfield(escena, 1, {
    cerca: [170, 380], lejos: [400, 780], tamañoCerca: 0.85, tamañoLejos: 1.25
  });

  function rotulo(texto, radioCuerpo, escalaFija = null) {
    const lienzo = document.createElement("canvas");
    lienzo.width = 512; lienzo.height = 160;
    const ctx = lienzo.getContext("2d");
    ctx.fillStyle = "rgba(248,250,252,.98)";
    ctx.font = "900 54px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(texto, 256, 86);
    const textura = new THREE.CanvasTexture(lienzo);
    textura.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, transparent: true, depthWrite: false }));
    const escala = escalaFija ?? (radioCuerpo > 25 ? 7.4 : Math.min(4.2, Math.max(1.25, radioCuerpo * .65 + 1.15)));
    sprite.scale.set(escala, escala * .32, 1);
    return sprite;
  }

  const objetos = {}, pulsables = [];
  FILA.forEach(item => {
    const cuerpo = conRutasDeTextura(BODY_DATA[item.slug]);
    const radio = RADIO_RELATIVO[item.slug] * item.unidad;
    const grupo = new THREE.Group();
    grupo.position.set(item.x, 0, 0);
    const malla = createBodyMesh(cuerpo, item.slug, { scale: radio / cuerpo.radius, stage: "modern" });
    malla.userData.slug = item.slug;
    grupo.add(malla);
    pulsables.push(malla);
    if (item.slug === "sun") grupo.add(createSunGlow(radio, 1.08));
    if (item.slug === "saturn") malla.add(createSaturnRings(radio, { texture: cuerpo.textures?.ring }));
    const etiqueta = rotulo(cuerpo.name, radio);
    etiqueta.position.set(0, radio + item.rotulo, 0);
    etiqueta.userData.slug = item.slug;
    grupo.add(etiqueta);
    pulsables.push(etiqueta);
    escena.add(grupo);
    objetos[item.slug] = { grupo, malla, cuerpo, radio };
  });

  // La Luna, colgada de un pivote que gira dentro del grupo de la Tierra.
  const pivoteLuna = new THREE.Group();
  {
    const cuerpo = conRutasDeTextura(BODY_DATA.moon);
    const radio = RADIO_RELATIVO.moon * UNIDAD;
    const grupo = new THREE.Group();
    grupo.position.set(RADIO_ORBITA_LUNA, 0, 0);
    const malla = createBodyMesh(cuerpo, "moon", { scale: radio / cuerpo.radius, stage: "modern" });
    malla.userData.slug = "moon";
    grupo.add(malla);
    pulsables.push(malla);
    const etiqueta = rotulo(cuerpo.name, radio, .85);
    etiqueta.position.set(0, radio + .55, 0);
    etiqueta.userData.slug = "moon";
    grupo.add(etiqueta);
    pulsables.push(etiqueta);
    pivoteLuna.add(grupo);
    objetos.earth.grupo.add(pivoteLuna);

    const puntos = Array.from({ length: 97 }, (_, i) => {
      const a = i / 96 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * RADIO_ORBITA_LUNA, 0, Math.sin(a) * RADIO_ORBITA_LUNA);
    });
    objetos.earth.grupo.add(new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(puntos),
      new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: .3 })
    ));
    objetos.moon = { grupo, malla, cuerpo, radio };
  }

  let elegido = null, distanciaObjetivo = 142, velocidadZoom = 0;

  const distanciaMinima = () => {
    if (!elegido) return 58;
    const entrada = objetos[elegido];
    return Math.max(entrada.radio * (elegido === "sun" ? 1.55 : 3.2), elegido === "sun" ? 52 : 3.2);
  };
  const acotar = valor => THREE.MathUtils.clamp(valor, distanciaMinima(), 380);
  /* La posición en el mundo, no la local: la Luna cuelga del pivote que la hace
     orbitar, así que su posición local es su distancia a la Tierra. */
  const posicionDe = entrada => entrada.grupo.getWorldPosition(new THREE.Vector3());

  function enfocar(slug) {
    const entrada = objetos[slug];
    if (!entrada) return;
    elegido = slug;
    controles.target.copy(posicionDe(entrada));
    distanciaObjetivo = acotar(Math.max(entrada.radio * 4.8, slug === "sun" ? 86 : 7));
    alElegir?.(slug);
  }

  /* El reset recupera también la posición de la cámara, no solo la distancia:
     los cuerpos están alineados en X, así que volver desde el detalle de
     Neptuno conservando su dirección deja la fila vista de canto. */
  function verGeneral() {
    elegido = null;
    velocidadZoom = 0;
    controles.target.set(10, 0, 0);
    distanciaObjetivo = 142;
    camara.position.set(16, 20, 142);
    alElegir?.(null);
  }

  const raycaster = new THREE.Raycaster(), puntero = new THREE.Vector2();
  const alPulsar = evento => {
    if (evento.target !== renderer.domElement) return;
    const caja = renderer.domElement.getBoundingClientRect();
    puntero.x = (evento.clientX - caja.left) / caja.width * 2 - 1;
    puntero.y = -((evento.clientY - caja.top) / caja.height) * 2 + 1;
    raycaster.setFromCamera(puntero, camara);
    const aciertos = raycaster.intersectObjects(pulsables);
    if (aciertos.length) enfocar(aciertos[0].object.userData.slug);
    else alElegir?.(null);
  };
  window.addEventListener("pointerdown", alPulsar);

  const alGirarRueda = evento => {
    evento.preventDefault();
    velocidadZoom += THREE.MathUtils.clamp(evento.deltaY, -160, 160) * .025;
  };
  renderer.domElement.addEventListener("wheel", alGirarRueda, { passive: false });

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
    const { segundos, avance } = reloj.paso(ms);
    cielo.update(segundos * 1000);
    if (Math.abs(velocidadZoom) > .001) {
      distanciaObjetivo = acotar(distanciaObjetivo + velocidadZoom * avance);
      velocidadZoom *= Math.pow(.78, avance);
    }
    Object.values(objetos).forEach(e => { e.malla.rotation.y += e.cuerpo.rotationSpeed * 2.2 * avance; });
    pivoteLuna.rotation.y += VELOCIDAD_ORBITA_LUNA * segundos;
    /* Con la Luna elegida, la cámara la sigue desplazándose lo mismo que el
       objetivo: moviendo solo el objetivo, la dirección cambia en cada cuadro y
       la cámara acaba dando la vuelta hasta que el Sol ocupa media pantalla. */
    if (elegido) {
      const objetivo = posicionDe(objetos[elegido]);
      const desplazamiento = objetivo.clone().sub(controles.target);
      controles.target.add(desplazamiento);
      camara.position.add(desplazamiento);
    }
    const deseada = controles.target.clone()
      .add(camara.position.clone().sub(controles.target).normalize().multiplyScalar(distanciaObjetivo));
    camara.position.lerp(deseada, .055);
    controles.update();
    renderer.render(escena, camara);
    cuadro = requestAnimationFrame(animar);
  }
  cuadro = requestAnimationFrame(animar);

  return {
    enfocar,
    verGeneral,
    desmontar() {
      if (!vivo) return;
      vivo = false;
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      window.removeEventListener("pointerdown", alPulsar);
      renderer.domElement.removeEventListener("wheel", alGirarRueda);
      controles.dispose();
      liberarEscena(escena);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  };
}
