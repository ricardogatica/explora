import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BODY_DATA, ROTATION_SLOWDOWN, SATELLITE_SLOWDOWN } from "../../../sistema_solar/data.js";
import {
  createBodyMesh, createSaturnRings, createSunGlow,
  hasPhotorealTextures, loadPhotorealBody, RING_OUTER_SCALE
} from "../../../sistema_solar/body-renderer.js";
import { addStarfield } from "../../../sistema_solar/starfield.js";
import { crearReloj } from "@explora/compartido/tiempo.js";
import { liberarEscena } from "@explora/compartido/desmontar.js";
import { conRutasDeTextura, BASE_TEXTURAS } from "../datos/texturas.js";

/* La escena de un cuerpo del sistema solar: el planeta con sus lunas y, si los
   tiene, sus anillos.

   Es la de sistema_solar/body.js montada en un elemento en vez de en la ventana.
   Todo lo que decide cómo se ve está copiado: el campo de 38 grados, la niebla,
   el tone mapping ACES con exposición 1,15, los dos esquemas de luz —uno para
   texturas fotográficas y otro para las procedurales—, la carga progresiva y el
   cálculo del encuadre con sus dos restricciones.

   Una sola cosa cambia a propósito, y está explicada abajo: el desplazamiento
   lateral. */

export function montarCuerpo(contenedor, slug) {
  const body = conRutasDeTextura(BODY_DATA[slug]);
  if (!body) return () => {};

  const escena = new THREE.Scene();
  escena.fog = new THREE.FogExp2(0x020617, 0.0022);

  const ancho = () => contenedor.clientWidth || 1;
  const alto = () => contenedor.clientHeight || 1;

  // 38 grados y no 55: el cuerpo llena el encuadre y se reduce la deformación
  // de perspectiva.
  const camara = new THREE.PerspectiveCamera(38, ancho() / alto(), 0.01, 4000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(ancho(), alto());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Sin tone mapping los colores salen lavados y las texturas se emborronan al
  // mirarlas en ángulo.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  contenedor.appendChild(renderer.domElement);

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.autoRotate = true;
  controles.autoRotateSpeed = 0.4 / ROTATION_SLOWDOWN;

  /* Dos esquemas de luz, porque cada uno sirve a un tipo de textura. Las
     procedurales necesitan relleno generoso o no se lee el volumen; las
     fotográficas necesitan lo contrario, un Sol duro y casi nada de relleno,
     porque su realismo vive en el contraste del terminador y en las luces de
     ciudad de la cara oscura. */
  const usaTexturasReales = hasPhotorealTextures(body);
  const posicionSol = new THREE.Vector3(6, 3, 4);
  if (usaTexturasReales) {
    const sol = new THREE.DirectionalLight(0xffffff, 3.9);
    sol.position.copy(posicionSol);
    escena.add(sol);
    escena.add(new THREE.HemisphereLight(0x9cc7ff, 0x020408, 0.055));
  } else {
    // El ambiente azulado funciona con los planetas de colores, pero sobre la
    // Luna es falso: es roca gris y el tinte la volvía celeste.
    const esRocaGris = slug === "moon" || slug === "mercury";
    escena.add(new THREE.AmbientLight(esRocaGris ? 0xbfc3cb : 0x91b4ff, esRocaGris ? 0.42 : 0.6));
    const principal = new THREE.PointLight(0xffffff, slug === "sun" ? 4.0 : 2.4, 0, 2);
    principal.position.copy(posicionSol);
    escena.add(principal);
    const relleno = new THREE.DirectionalLight(esRocaGris ? 0xcdd3dd : 0x7dd3fc, esRocaGris ? 0.35 : 0.7);
    relleno.position.set(-6, 2, -4);
    escena.add(relleno);
  }

  const cielo = addStarfield(escena, body.radius);

  function rotulo(texto, escala = [.72, .22, 1]) {
    const lienzo = document.createElement("canvas");
    lienzo.width = 384; lienzo.height = 96;
    const ctx = lienzo.getContext("2d");
    ctx.fillStyle = "rgba(248,250,252,.94)";
    ctx.font = "800 38px Inter, sans-serif";
    ctx.fillText(texto, 18, 58);
    const textura = new THREE.CanvasTexture(lienzo);
    textura.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, transparent: true, depthWrite: false }));
    sprite.scale.set(...escala);
    return sprite;
  }

  const grupo = new THREE.Group();
  escena.add(grupo);
  let malla = createBodyMesh(body, slug, { stage: "modern" });
  let capaNubes = null, anillos = null;
  grupo.add(malla);

  /* Carga progresiva: la procedural se ve desde el primer cuadro y la
     fotorrealista la sustituye cuando sus mapas llegan. Si la descarga falla se
     queda la procedural: nadie ve una esfera negra. */
  let vivo = true;
  if (usaTexturasReales) {
    const direccionSol = { value: posicionSol.clone().normalize() };
    loadPhotorealBody(body, { radius: body.radius, sunDirection: direccionSol, anisotropy: maxAnisotropy })
      .then(foto => {
        // Puede llegar después de desmontar: entonces se descarta y se libera.
        if (!vivo) { liberarEscena(foto.group); return; }
        grupo.remove(malla);
        malla.geometry?.dispose(); malla.material?.dispose();
        foto.group.rotation.copy(malla.rotation);
        grupo.add(foto.group);
        malla = foto.group;
        capaNubes = foto.cloudLayer;
        if (anillos) malla.add(anillos);
      })
      .catch(error => {
        console.warn(`No se pudieron cargar las texturas de ${body.name}; se mantiene la vista procedural.`, error);
      });
  }
  if (slug === "sun") grupo.add(createSunGlow(body.radius, 1.16));
  if (slug === "saturn") {
    anillos = createSaturnRings(body.radius, { texture: body.textures?.ring });
    malla.add(anillos);
  }

  const satelites = [];
  (body.satellites ?? []).forEach((satelite, indice) => {
    const puntos = Array.from({ length: 160 }, (_, i) => {
      const a = i / 160 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * satelite.orbitRadius, Math.sin(a) * satelite.orbitRadius * .08, Math.sin(a) * satelite.orbitRadius);
    });
    const orbita = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(puntos),
      new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: .26 })
    );
    grupo.add(orbita);

    const grupoLuna = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: satelite.texture ? 0xffffff : satelite.color, roughness: 1 });
    if (satelite.texture) {
      new THREE.TextureLoader().load(BASE_TEXTURAS + satelite.texture, textura => {
        textura.colorSpace = THREE.SRGBColorSpace;
        textura.anisotropy = maxAnisotropy;
        material.map = textura;
        material.needsUpdate = true;
      }, undefined, () => { material.color.setHex(satelite.color); });
    }
    const luna = new THREE.Mesh(new THREE.SphereGeometry(satelite.radius, 48, 48), material);
    grupoLuna.add(luna);
    const etiqueta = rotulo(satelite.name);
    etiqueta.position.set(0, satelite.radius + .22, 0);
    grupoLuna.add(etiqueta);
    grupo.add(grupoLuna);
    satelites.push({ grupo: grupoLuna, malla: luna, satelite, angulo: indice * .9 });
  });

  /* Encuadre. Sin lunas, 3,3 radios y el cuerpo llena el cuadro. Con lunas manda
     la órbita más lejana, no el planeta: Calisto orbita Júpiter a 3,8 y con la
     cámara a 3,13 las cuatro galileanas caían fuera. Y con anillos manda su
     borde exterior, o Saturno sale cortado por arriba y por abajo.

     Se resuelven las dos restricciones —el ancho y el alto— y manda la que
     aprieta, porque un sistema de lunas se extiende sobre el plano orbital, o
     sea a lo ancho. */
  const alcanceLunas = body.satellites?.length
    ? Math.max(...body.satellites.map(s => s.orbitRadius + s.radius)) : 0;
  const alcanceAnillos = body.textures?.ring ? body.radius * RING_OUTER_SCALE : 0;
  const alcance = Math.max(alcanceLunas, alcanceAnillos);
  const MEDIA_FOV = Math.tan(38 / 2 * Math.PI / 180);

  const distanciaDeEncuadre = () => {
    if (!alcance) return body.radius * (slug === "sun" ? 3.6 : 3.3);
    const necesarioAlto = Math.max(body.radius, alcance * 0.34);
    return Math.max(necesarioAlto / MEDIA_FOV, alcance / (MEDIA_FOV * (ancho() / alto()))) * 1.16;
  };
  let distancia = distanciaDeEncuadre();

  /* Aquí está el único cambio deliberado respecto del original: no hay
     desplazamiento lateral. En el sitio anterior el conjunto se movía a la
     derecha porque el panel de información tapaba el tercio izquierdo de la
     pantalla y el rótulo de Europa acababa medio oculto. En la ficha nueva la
     escena tiene su propio recuadro y no hay nada encima, así que desplazarla
     dejaría el planeta descentrado sin ningún motivo. */
  camara.position.set(0, distancia * (alcance ? 0.34 : 0.06), distancia);
  controles.target.set(0, 0, 0);
  controles.minDistance = body.radius * 1.35;
  controles.maxDistance = Math.max(body.radius, alcance) * 20;

  const observador = new ResizeObserver(() => {
    camara.aspect = ancho() / alto();
    camara.updateProjectionMatrix();
    renderer.setSize(ancho(), alto());
    /* Al cambiar la proporción cambia cuál de las dos restricciones manda, así
       que el encuadre se recalcula; solo si nadie ha tocado el zoom todavía. */
    const nueva = distanciaDeEncuadre();
    if (Math.abs(camara.position.length() - distancia) < 0.01) {
      camara.position.setLength(nueva);
      distancia = nueva;
    }
  });
  observador.observe(contenedor);

  const reloj = crearReloj();
  let cuadro = null;
  function animar(ms) {
    if (!vivo) return;
    const { segundos, avance } = reloj.paso(ms);
    cielo.update(segundos * 1000);
    grupo.rotation.y += .0003 / ROTATION_SLOWDOWN * avance;
    malla.rotation.y += body.rotationSpeed * (slug === "sun" ? 2.5 : 2.1) / ROTATION_SLOWDOWN * avance;
    // Las nubes van algo más rápido que la superficie: la atmósfera no rota
    // solidaria con el suelo.
    if (capaNubes) capaNubes.rotation.y += body.rotationSpeed * 0.34 / ROTATION_SLOWDOWN * avance;
    satelites.forEach(entrada => {
      entrada.angulo += entrada.satelite.orbitSpeed / SATELLITE_SLOWDOWN * avance;
      const { orbitRadius } = entrada.satelite;
      entrada.grupo.position.set(
        Math.cos(entrada.angulo) * orbitRadius,
        Math.sin(entrada.angulo) * orbitRadius * .08,
        Math.sin(entrada.angulo) * orbitRadius
      );
      entrada.malla.rotation.y += .003 / SATELLITE_SLOWDOWN * avance;
    });
    if (anillos) anillos.rotation.z += 0.0008 * avance;
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
