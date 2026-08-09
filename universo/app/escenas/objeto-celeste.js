import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { animateGalaxyObject, createMilkyWayObject } from "../../../sistema_solar/galaxy-renderer.js";
import { animateStellarObject, createQuasarObject, createStarObject } from "../../../sistema_solar/star-renderer.js";
import { addStarfield } from "../../../sistema_solar/starfield.js";
import { crearReloj } from "@explora/compartido/tiempo.js";
import { liberarEscena } from "@explora/compartido/desmontar.js";

/* La escena de una ficha del universo: una estrella, un quásar o una galaxia.

   Es la de sistema_solar/universe-body.js con dos diferencias y ninguna más:
   se monta en el elemento que le den en vez de en toda la ventana, y devuelve
   una función que la desmonta. Todo lo que decide cómo se ve —el campo de 38
   grados, la niebla a 0,0017, las luces, las distancias de cámara, el giro
   automático— está copiado tal cual, a propósito: el objetivo de la migración
   no es rediseñar nada.

   Los renderizadores se importan de sistema_solar en vez de copiarse. Mientras
   las dos versiones convivan, dos copias del shader estelar se separarían a la
   primera corrección; cuando el sitio anterior se retire, esos módulos se mudan
   aquí y este import es lo único que cambia. */

export function montarObjetoCeleste(contenedor, objeto) {
  const escena = new THREE.Scene();
  escena.fog = new THREE.FogExp2(0x020617, 0.0017);

  const ancho = () => contenedor.clientWidth || 1;
  const alto = () => contenedor.clientHeight || 1;

  // 38 grados, el mismo campo que el resto de vistas de detalle.
  const camara = new THREE.PerspectiveCamera(38, ancho() / alto(), 0.01, 6000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(ancho(), alto());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  contenedor.appendChild(renderer.domElement);

  const esGalaxia = objeto.kind === "galaxy";

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.autoRotate = !esGalaxia;
  controles.autoRotateSpeed = 0.35;
  controles.enableZoom = !esGalaxia;

  escena.add(new THREE.AmbientLight(0x9bbcff, 0.55));
  const principal = new THREE.PointLight(0xffffff, objeto.kind === "quasar" ? 4.8 : 2.5, 0, 2);
  principal.position.set(8, 5, 7);
  escena.add(principal);
  const relleno = new THREE.DirectionalLight(0x7dd3fc, 0.65);
  relleno.position.set(-8, 4, -8);
  escena.add(relleno);

  const cielo = addStarfield(escena, esGalaxia ? 6 : Math.max(objeto.size, 4));
  const grupo = new THREE.Group();
  escena.add(grupo);
  const partes = esGalaxia
    ? createMilkyWayObject(objeto, { detail: true })
    : objeto.kind === "quasar"
      ? createQuasarObject(objeto, { detail: true })
      : createStarObject(objeto, { detail: true });
  grupo.add(partes.group);

  /* 3,3 tamaños de distancia para estrellas y quásares: con el suelo anterior de
     18, las estrellas pequeñas quedaban diminutas. La galaxia se queda a 840 y
     no se aleja: con la niebla de esta escena, a 1270 ya está oscurecida al 99%
     y desaparece. */
  const distancia = esGalaxia ? 840 : objeto.kind === "quasar" ? objeto.size * 3.6 : objeto.size * 3.3;
  let distanciaObjetivo = distancia, velocidadZoom = 0;
  camara.position.set(esGalaxia ? -80 : 0, esGalaxia ? 170 : objeto.size * 0.15, distancia);
  controles.target.set(0, 0, 0);
  controles.minDistance = esGalaxia ? 85 : objeto.size * 1.35;
  controles.maxDistance = esGalaxia ? 960 : objeto.size * 20;

  const suavizar = (valor, desde, hasta) => {
    const t = THREE.MathUtils.clamp((valor - desde) / (hasta - desde), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const centroSolar = () => partes.solarMarker?.getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3();

  function zoomDeGalaxia() {
    if (!esGalaxia) return;
    if (Math.abs(velocidadZoom) > .001) {
      distanciaObjetivo = THREE.MathUtils.clamp(distanciaObjetivo + velocidadZoom, controles.minDistance, controles.maxDistance);
      velocidadZoom *= .78;
    }
    const normalizado = 1 - (distanciaObjetivo - controles.minDistance) / (controles.maxDistance - controles.minDistance);
    const fuerza = suavizar(normalizado, .18, .82);
    controles.target.lerp(new THREE.Vector3().lerpVectors(new THREE.Vector3(), centroSolar(), fuerza), .08);
    const deseada = controles.target.clone()
      .add(camara.position.clone().sub(controles.target).normalize().multiplyScalar(distanciaObjetivo));
    camara.position.lerp(deseada, .06);
  }

  /* La rueda se escucha en el lienzo y no en la ventana: aquí la escena está
     incrustada en una página que se desplaza, y capturar la rueda de toda la
     ventana dejaría la página clavada. */
  const alGirarRueda = evento => {
    if (!esGalaxia) return;
    evento.preventDefault();
    velocidadZoom += THREE.MathUtils.clamp(evento.deltaY, -160, 160) * .75;
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
    const tiempo = ms * .001, { segundos, avance } = reloj.paso(ms);
    cielo.update(segundos * 1000);
    if (esGalaxia) { animateGalaxyObject(partes, tiempo, avance); zoomDeGalaxia(); }
    else animateStellarObject(partes, tiempo, avance);
    controles.update();
    renderer.render(escena, camara);
    cuadro = requestAnimationFrame(animar);
  }
  cuadro = requestAnimationFrame(animar);

  return function desmontar() {
    if (!vivo) return;
    vivo = false;
    cancelAnimationFrame(cuadro);
    observador.disconnect();
    renderer.domElement.removeEventListener("wheel", alGirarRueda);
    controles.dispose();
    liberarEscena(escena);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
