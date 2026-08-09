import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { getGlowTexture, starSurfaceMaterial } from "../../../sistema_solar/star-renderer.js";
import { addStarfield } from "../../../sistema_solar/starfield.js";
import { crearReloj } from "@explora/compartido/tiempo.js";
import { liberarEscena } from "@explora/compartido/desmontar.js";
import { ESCALONES, estrella, numero } from "../datos/soles.js";

/* La escala de soles: nueve estrellas medidas en radios solares, en tres
   escalones. Copiada de sistema_solar/star-scale.js sin rediseñar nada.

   Igual que la escala planetaria: la escena avisa por callback de qué estrella
   se ha elegido y no sabe nada del panel que lo cuenta. */

const RADIO_EN_PANTALLA = 9, SEPARACION = 3.4, ALTO_FILA = 27;

/* Rotación. Los periodos reales no caben en una vista —Vega gira en medio día y
   Betelgeuse tarda unos cinco años— así que se conserva el hecho cualitativo,
   que es el que enseña algo: cuanto más grande, más despacio. El periodo crece
   con la raíz cuarta del radio. En radianes por SEGUNDO, no por cuadro. */
const VUELTA_DEL_SOL = 34;
const velocidadDeGiro = radioSolar => Math.PI * 2 / (VUELTA_DEL_SOL * Math.pow(radioSolar, .25));

export function montarEscalaDeSoles(contenedor, { alElegir } = {}) {
  const escena = new THREE.Scene();
  escena.fog = new THREE.FogExp2(0x020617, 0.0009);

  const ancho = () => contenedor.clientWidth || 1;
  const alto = () => contenedor.clientHeight || 1;

  const camara = new THREE.PerspectiveCamera(46, ancho() / alto(), 0.01, 4000);
  camara.position.set(0, 6, 132);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(ancho(), alto());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  contenedor.appendChild(renderer.domElement);

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.enableZoom = false;
  controles.minDistance = 3;
  controles.maxDistance = 420;
  controles.target.set(0, 0, 0);

  escena.add(new THREE.AmbientLight(0xdbeafe, .35));
  const cielo = addStarfield(escena, 1, {
    cerca: [190, 420], lejos: [440, 860], tamañoCerca: .8, tamañoLejos: 1.2
  });

  /* El rótulo se mide antes de dibujarlo: con un lienzo de ancho fijo,
     «ENANAS Y ESTRELLAS COMO EL SOL · ESCALA DE REFERENCIA» se cortaba a media
     palabra. */
  function rotuloDeFila(texto) {
    const rotulo = texto.toUpperCase(), fuente = "900 40px Inter, sans-serif", altoLienzo = 96;
    const medidor = document.createElement("canvas").getContext("2d");
    medidor.font = fuente;
    const anchoLienzo = Math.ceil(medidor.measureText(rotulo).width) + 16;
    const lienzo = document.createElement("canvas");
    lienzo.width = anchoLienzo; lienzo.height = altoLienzo;
    const ctx = lienzo.getContext("2d");
    ctx.fillStyle = "rgba(167,139,250,.92)"; ctx.font = fuente;
    ctx.fillText(rotulo, 8, 60);
    const textura = new THREE.CanvasTexture(lienzo);
    textura.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, transparent: true, opacity: .9, depthWrite: false }));
    const altoEnEscena = 3.4;
    sprite.scale.set(altoEnEscena * anchoLienzo / altoLienzo, altoEnEscena, 1);
    sprite.center.set(0, .5);
    return sprite;
  }

  function rotuloDeEstrella(nombre, medida, radioDibujado) {
    const lienzo = document.createElement("canvas");
    lienzo.width = 512; lienzo.height = 180;
    const ctx = lienzo.getContext("2d");
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(248,250,252,.98)"; ctx.font = "900 52px Inter, sans-serif";
    ctx.fillText(nombre, 256, 64);
    ctx.fillStyle = "rgba(125,211,252,.96)"; ctx.font = "800 40px Inter, sans-serif";
    ctx.fillText(medida, 256, 124);
    const textura = new THREE.CanvasTexture(lienzo);
    textura.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, transparent: true, depthWrite: false }));
    /* El mínimo hace legible «Próxima Centauri», que se dibuja como un punto de
       medio píxel: su nombre no puede encogerse con ella. */
    const escala = THREE.MathUtils.clamp(radioDibujado * .9 + 2.4, 5.6, 9);
    sprite.scale.set(escala, escala * .35, 1);
    return sprite;
  }

  const objetos = {}, pulsables = [], materiales = [];
  let mitadAncho = 0, mitadAlto = 0;
  const unidadDeReferencia = RADIO_EN_PANTALLA / Math.max(...ESCALONES[0].soles.map(s => estrella(s).radioSolar));

  ESCALONES.forEach((escalon, fila) => {
    const soles = escalon.soles.map(estrella);
    const unidad = RADIO_EN_PANTALLA / Math.max(...soles.map(s => s.radioSolar));
    const radios = soles.map(s => s.radioSolar * unidad);
    const anchoFila = radios.reduce((total, r) => total + r * 2, 0) + SEPARACION * (soles.length - 1);
    const y = (1 - fila) * ALTO_FILA;
    let x = -anchoFila / 2;
    mitadAncho = Math.max(mitadAncho, anchoFila / 2);
    mitadAlto = Math.max(mitadAlto, Math.abs(y) + RADIO_EN_PANTALLA + 9);

    const reduccion = Math.round(unidadDeReferencia / unidad);
    const rotulo = rotuloDeFila(fila === 0
      ? `${escalon.titulo} · escala de referencia`
      : `${escalon.titulo} · escala 1:${reduccion}`);
    rotulo.position.set(-anchoFila / 2, y + RADIO_EN_PANTALLA + 7.5, 0);
    escena.add(rotulo);

    soles.forEach((sol, indice) => {
      const radio = radios[indice];
      x += radio;
      const grupo = new THREE.Group();
      grupo.position.set(x, y, 0);
      /* La misma estrella aparece en dos filas: la clave lleva la fila para que
         elegir lleve a la que se ha pulsado y no a su gemela. */
      const clave = `${sol.slug}@${fila}`;
      const material = starSurfaceMaterial(sol.color, { spots: sol.radioSolar > 100 ? .34 : .2 });
      materiales.push(material);
      const malla = new THREE.Mesh(new THREE.SphereGeometry(radio, 64, 64), material);
      malla.userData.clave = clave;
      grupo.add(malla);
      pulsables.push(malla);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: getGlowTexture(), color: sol.color, transparent: true, opacity: .42,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      halo.scale.set(radio * 4.2, radio * 4.2, 1);
      grupo.add(halo);
      const etiqueta = rotuloDeEstrella(sol.name, `${numero(sol.radioSolar)} R☉`, radio);
      etiqueta.position.set(0, radio + 2.4, 0);
      etiqueta.userData.clave = clave;
      grupo.add(etiqueta);
      pulsables.push(etiqueta);
      escena.add(grupo);
      objetos[clave] = { grupo, sol, radio, malla, velocidad: velocidadDeGiro(sol.radioSolar) };
      x += radio + SEPARACION;
    });
  });

  /* Distancia a la que las tres filas caben enteras: se resuelven las dos
     restricciones y manda la que quede más lejos. En apaisado suele ser el
     alto; en una pantalla estrecha, el ancho. */
  const distanciaGeneral = () => {
    const mitadFov = THREE.MathUtils.degToRad(camara.fov) / 2;
    return Math.max(mitadAlto / Math.tan(mitadFov), mitadAncho / (Math.tan(mitadFov) * camara.aspect)) * 1.06;
  };

  let elegida = null, distanciaObjetivo = distanciaGeneral(), velocidadZoom = 0;

  function enfocar(clave) {
    const entrada = objetos[clave];
    if (!entrada) return;
    elegida = clave;
    controles.target.copy(entrada.grupo.position);
    distanciaObjetivo = THREE.MathUtils.clamp(entrada.radio * 5.4, 14, 420);
    alElegir?.(entrada.sol.slug);
  }

  /* La dirección también vuelve al frente, no solo la distancia: al enfocar una
     estrella la cámara se queda mirando desde donde la vio, y como las tres
     filas están alineadas en X, recuperar solo la distancia dejaba la escena
     vista de canto. */
  function vistaGeneral() {
    elegida = null;
    velocidadZoom = 0;
    controles.target.set(0, 0, 0);
    distanciaObjetivo = distanciaGeneral();
    camara.position.set(0, 6, distanciaObjetivo);
    alElegir?.(null);
  }
  vistaGeneral();

  const raycaster = new THREE.Raycaster(), puntero = new THREE.Vector2();
  const alPulsar = evento => {
    if (evento.target !== renderer.domElement) return;
    const caja = renderer.domElement.getBoundingClientRect();
    puntero.x = (evento.clientX - caja.left) / caja.width * 2 - 1;
    puntero.y = -((evento.clientY - caja.top) / caja.height) * 2 + 1;
    raycaster.setFromCamera(puntero, camara);
    const aciertos = raycaster.intersectObjects(pulsables);
    if (aciertos.length) enfocar(aciertos[0].object.userData.clave);
    else alElegir?.(null);
  };
  window.addEventListener("pointerdown", alPulsar);

  const alGirarRueda = evento => {
    evento.preventDefault();
    velocidadZoom += THREE.MathUtils.clamp(evento.deltaY, -160, 160) * .03;
  };
  renderer.domElement.addEventListener("wheel", alGirarRueda, { passive: false });

  const observador = new ResizeObserver(() => {
    camara.aspect = ancho() / alto();
    camara.updateProjectionMatrix();
    renderer.setSize(ancho(), alto());
    // Girar el teléfono cambia qué restricción manda; con una estrella elegida
    // no se toca, que ahí manda el zoom.
    if (!elegida) distanciaObjetivo = distanciaGeneral();
  });
  observador.observe(contenedor);

  const reloj = crearReloj();
  let cuadro = null, vivo = true;
  function animar(ms) {
    if (!vivo) return;
    const { segundos, avance } = reloj.paso(ms);
    cielo.update(segundos * 1000);
    if (Math.abs(velocidadZoom) > .001) {
      distanciaObjetivo = THREE.MathUtils.clamp(
        distanciaObjetivo + velocidadZoom * avance,
        elegida ? objetos[elegida].radio * 1.5 + 2 : 24, 420
      );
      velocidadZoom *= Math.pow(.78, avance);
    }
    materiales.forEach(material => { material.uniforms.uTime.value = ms * .001; });
    Object.values(objetos).forEach(e => { e.malla.rotation.y += e.velocidad * segundos; });
    const deseada = controles.target.clone()
      .add(camara.position.clone().sub(controles.target).normalize().multiplyScalar(distanciaObjetivo));
    camara.position.lerp(deseada, .055);
    controles.update();
    renderer.render(escena, camara);
    cuadro = requestAnimationFrame(animar);
  }
  cuadro = requestAnimationFrame(animar);

  return {
    vistaGeneral,
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
