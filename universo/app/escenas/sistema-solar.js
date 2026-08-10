import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BODY_DATA, BODY_ORDER, ROTATION_SLOWDOWN, getOrbitPosition } from "../../cielo/data.js";
import { crearReloj } from "@explora/compartido/tiempo.js";
import { liberarEscena } from "@explora/compartido/desmontar.js";
import { crearCuerposMenores } from "./cuerpos-menores.js";

/* El sistema solar visto desde arriba: la escena de la ficha del conjunto.

   Hay ya dos vistas del sistema y ninguna servía aquí. La escala planetaria
   pone los nueve en fila por tamaño y deja al Sol medio fuera de cuadro a
   propósito —eso es lo que enseña, y por eso está bien así—; la vista del
   universo trae la línea temporal, las constelaciones y la galaxia, que en una
   ficha sobran. Lo que falta es lo obvio: las órbitas.

   Ligera a propósito. Los planetas son esferas de color plano y no llevan
   textura: a este tamaño ocupan unos pocos píxeles y una textura de dos mil por
   mil sería descargar dos megas para pintar un punto. Las texturas están en las
   fichas de cada cuerpo, que es donde se ven.

   Las distancias están comprimidas, como en el resto del sitio. Si fueran
   reales y Neptuno cupiera en el recuadro, la Tierra sería un objeto de menos
   de un píxel pegado al Sol. */

const INCLINACION_VISTA = 0.92;   // radianes sobre el plano, para que se lean las elipses

export function montarSistemaSolar(contenedor) {
  const escena = new THREE.Scene();

  const ancho = () => contenedor.clientWidth || 1;
  const alto = () => contenedor.clientHeight || 1;

  const camara = new THREE.PerspectiveCamera(46, ancho() / alto(), 0.1, 900);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(ancho(), alto());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x05070f, 1);
  contenedor.appendChild(renderer.domElement);

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.dampingFactor = 0.06;
  controles.enablePan = false;
  controles.minDistance = 22;
  controles.maxDistance = 140;
  controles.autoRotate = true;
  controles.autoRotateSpeed = 0.22;

  /* El Sol ilumina desde el centro, como es debido: así cada planeta tiene su
     lado de día y su lado de noche y no parece una pegatina. */
  escena.add(new THREE.AmbientLight(0x8899cc, 0.45));
  const luzSolar = new THREE.PointLight(0xfff4e0, 3.2, 0, 2);
  escena.add(luzSolar);

  const planetas = [];

  /* El Sol se dibuja más pequeño de lo que le tocaría. A escala real de
     tamaños taparía las órbitas interiores enteras, y esta vista es de
     órbitas: la de tamaños es la escala planetaria, que está a un clic. */
  const sol = new THREE.Mesh(
    new THREE.SphereGeometry(BODY_DATA.sun.radius * 0.85, 40, 40),
    new THREE.MeshBasicMaterial({ color: 0xffcc33 })
  );
  escena.add(sol);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(BODY_DATA.sun.radius * 1.5, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  escena.add(halo);

  for (const slug of BODY_ORDER) {
    if (slug === "sun") continue;
    const cuerpo = BODY_DATA[slug];
    const indice = BODY_ORDER.indexOf(slug);

    const malla = new THREE.Mesh(
      new THREE.SphereGeometry(cuerpo.radius, 28, 28),
      new THREE.MeshStandardMaterial({ color: cuerpo.color ?? 0x93a3b8, roughness: 0.85, metalness: 0.05 })
    );
    escena.add(malla);

    /* La órbita, un aro fino en el plano. Se dibuja con la misma inclinación
       que usa la vista del universo para que las dos cuenten lo mismo: las
       órbitas no están todas en el mismo plano exacto. */
    const aro = new THREE.Mesh(
      new THREE.RingGeometry(cuerpo.orbitRadius - 0.035, cuerpo.orbitRadius + 0.035, 160),
      new THREE.MeshBasicMaterial({ color: slug === "earth" ? 0x3b82f6 : 0x2b3a52, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    aro.rotation.x = Math.PI / 2;
    escena.add(aro);

    planetas.push({ slug, cuerpo, malla, indice });
  }

  const cuerposMenores = crearCuerposMenores({
    interior: BODY_DATA.mars.orbitRadius * 1.12,
    exterior: BODY_DATA.jupiter.orbitRadius * 0.88
  });
  escena.add(cuerposMenores.grupo);

  /* Encuadre: la órbita de Neptuno manda, y se resuelve la distancia a la que
     cabe entera contando el campo de visión y la proporción del recuadro. Sale
     del dato, así que si mañana se ajusta una órbita el encuadre se ajusta
     solo, y funciona igual en un móvil que en una pantalla ancha. */
  function encuadrar() {
    const alcance = Math.max(...BODY_ORDER.map(slug => BODY_DATA[slug].orbitRadius)) * 1.12;
    const mitadFov = THREE.MathUtils.degToRad(camara.fov) / 2;
    const porAlto = alcance / Math.tan(mitadFov);
    const porAncho = alcance / (Math.tan(mitadFov) * camara.aspect);
    const distancia = Math.max(porAlto, porAncho);
    camara.position.set(0, distancia * Math.sin(INCLINACION_VISTA), distancia * Math.cos(INCLINACION_VISTA));
    controles.target.set(0, 0, 0);
    controles.maxDistance = distancia * 1.6;
    controles.update();
  }
  encuadrar();

  const observador = new ResizeObserver(() => {
    camara.aspect = ancho() / alto();
    camara.updateProjectionMatrix();
    renderer.setSize(ancho(), alto());
    encuadrar();
  });
  observador.observe(contenedor);

  const reloj = crearReloj();
  let cuadro = null, vivo = true;

  function animar(ms) {
    if (!vivo) return;
    const { segundos, avance } = reloj.paso(ms);

    for (const { cuerpo, malla, indice } of planetas) {
      const donde = getOrbitPosition(cuerpo, segundos, indice, 1);
      malla.position.set(donde.x, donde.y, donde.z);
      malla.rotation.y += cuerpo.rotationSpeed / ROTATION_SLOWDOWN * avance;
    }
    sol.rotation.y += BODY_DATA.sun.rotationSpeed / ROTATION_SLOWDOWN * avance;
    cuerposMenores.actualizar(segundos, 1);

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
    controles.dispose();
    liberarEscena(escena);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
