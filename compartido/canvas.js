import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { crearReloj } from "./tiempo.js";
import { liberarEscena } from "./desmontar.js";

/* Montar y desmontar una escena 3D.

   Lo usan las dos aplicaciones: las escenas del universo y las figuras que se
   incrustan en las páginas de las materias. Está escrito en JavaScript llano, sin
   React, porque el universo no lo usa; el envoltorio de React vive en su app y
   solo llama a esto.

   `import "three"` funciona en los dos mundos sin cambiar nada: en materias lo
   resuelve el empaquetador, y en el universo el importmap de cada HTML. Ese es
   el motivo de que este archivo no importe nada más.

   La razón de existir es el desmontaje. Montar sin desmontar no da ningún error:
   deja la escena entera en la memoria de la tarjeta gráfica, y al superar los
   ~16 contextos WebGL que permite el navegador, el canvas se queda en negro sin
   una sola línea en la consola. */

export function montarEscena(lienzo, {
  fondo = 0x020617,
  fov = 45,
  cerca = 0.01,
  lejos = 2000,
  camara: posicionCamara = [0, 1.4, 5],
  objetivo = [0, 0, 0],
  controles: conControles = true,
  girarSolo = 0,
  alAnimar
} = {}) {
  const escena = new THREE.Scene();
  if (fondo !== null) escena.background = new THREE.Color(fondo);

  const ancho = () => lienzo.clientWidth || 1;
  const alto = () => lienzo.clientHeight || 1;

  const camara = new THREE.PerspectiveCamera(fov, ancho() / alto(), cerca, lejos);
  camara.position.set(...posicionCamara);
  camara.lookAt(...objetivo);

  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: fondo === null });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(ancho(), alto(), false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const controles = conControles ? new OrbitControls(camara, lienzo) : null;
  if (controles) {
    controles.enableDamping = true;
    controles.target.set(...objetivo);
    controles.update();
  }

  /* Se redimensiona observando el propio lienzo y no la ventana: una figura
     incrustada en una página cambia de tamaño cuando cambia su columna, no
     cuando cambia el navegador. */
  const observador = new ResizeObserver(() => {
    camara.aspect = ancho() / alto();
    camara.updateProjectionMatrix();
    renderer.setSize(ancho(), alto(), false);
  });
  observador.observe(lienzo);

  const reloj = crearReloj();
  let cuadro = null;
  let vivo = true;

  function animar(ms) {
    if (!vivo) return;
    const { segundos, avance } = reloj.paso(ms);
    if (girarSolo) escena.rotation.y += girarSolo * segundos;
    alAnimar?.({ escena, camara, segundos, avance });
    controles?.update();
    renderer.render(escena, camara);
    cuadro = requestAnimationFrame(animar);
  }
  cuadro = requestAnimationFrame(animar);

  /* El orden importa: primero se para el bucle, porque un cuadro que se cuele
     después de liberar la escena dibujaría sobre geometrías ya soltadas. */
  function desmontar() {
    if (!vivo) return;
    vivo = false;
    if (cuadro !== null) cancelAnimationFrame(cuadro);
    observador.disconnect();
    controles?.dispose();
    liberarEscena(escena);
    renderer.dispose();
    /* Y esto es lo que de verdad devuelve el contexto WebGL. `dispose()` suelta
       los recursos, pero el contexto sigue contando para el límite del navegador
       hasta que se fuerza su pérdida. Sin esta línea, el fallo aparece a la
       novena o décima navegación. */
    renderer.forceContextLoss();
  }

  return { escena, camara, renderer, controles, desmontar, THREE };
}
