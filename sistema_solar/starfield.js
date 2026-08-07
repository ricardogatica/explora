import * as THREE from "three";

/* Campo de estrellas de fondo, compartido por todas las vistas de detalle.

   Antes cada vista tenía su propia copia: una sola capa, un único color y
   todas las estrellas del mismo brillo. Se veía plano y muerto.

   Lo que le da vida son tres cosas, y ninguna cuesta rendimiento apreciable:

   - Dos capas a distinta profundidad que giran en sentidos opuestos y a
     distinta velocidad. Eso produce paralaje: al mover la cámara las cercanas
     se desplazan más que las lejanas, y el cielo deja de parecer un telón.
   - Color por estrella, de una paleta corta. Las estrellas reales no son
     todas del mismo blanco azulado: hay cálidas y frías.
   - Brillo por estrella. Sin esa variación el cielo parece una rejilla.

   Los radios se dan en múltiplos del tamaño del cuerpo que se está mirando,
   así que el resultado se ve igual tanto si es la Luna como si es el Sol. */

const PALETA = [0xb9d7ff, 0xffffff, 0xffe0bb, 0xd8e7ff];

function capa(count, radioMin, radioMax, size, opacity) {
  const posiciones = new Float32Array(count * 3);
  const colores = new Float32Array(count * 3);
  const colores3 = PALETA.map(c => new THREE.Color(c));

  for (let i = 0; i < count; i++) {
    // Distribución uniforme sobre la esfera: sin el acos, las estrellas se
    // apelotonan en los polos.
    const r = THREE.MathUtils.randFloat(radioMin, radioMax);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    posiciones[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    posiciones[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    posiciones[i * 3 + 2] = r * Math.cos(phi);

    const c = colores3[(Math.random() * colores3.length) | 0];
    const brillo = THREE.MathUtils.randFloat(0.55, 1);
    colores[i * 3] = c.r * brillo;
    colores[i * 3 + 1] = c.g * brillo;
    colores[i * 3 + 2] = c.b * brillo;
  }

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
  geometria.setAttribute("color", new THREE.BufferAttribute(colores, 3));

  return new THREE.Points(geometria, new THREE.PointsMaterial({
    size,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false
  }));
}

/**
 * Añade el cielo a la escena.
 * @param scene  escena de Three.js
 * @param escala tamaño característico de lo que se mira (radio del cuerpo).
 *               Todo se dimensiona a partir de él, así que el cielo se ve
 *               igual con la Luna que con el Sol.
 * @returns {{update:(dt:number)=>void, setVisible:(v:boolean)=>void}}
 */
export function addStarfield(scene, escala = 1) {
  const cerca = capa(4500, 40 * escala, 120 * escala, 0.09 * escala, 0.88);
  const lejos = capa(9000, 125 * escala, 320 * escala, 0.14 * escala, 0.62);
  scene.add(cerca, lejos);

  return {
    // Giro lento y en sentidos opuestos: es lo que se percibe como profundidad.
    update(dt) {
      cerca.rotation.y += dt * 0.00018;
      lejos.rotation.y -= dt * 0.00005;
    },
    setVisible(v) {
      cerca.visible = v;
      lejos.visible = v;
    }
  };
}
