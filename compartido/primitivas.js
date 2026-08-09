import * as THREE from "three";

/* Figuras que se pueden mirar por todos lados.

   Son para las páginas de las materias: una esfera que se gira con el dedo
   enseña más de una esfera que un dibujo de una esfera, y sobre todo deja ver
   que el volumen no es el área ni el perímetro.

   Cada figura sabe sus propias medidas y las calcula, no las trae escritas: si
   alguien cambia el radio en el markdown, el volumen que se muestra es el de esa
   esfera y no el de la que había cuando se escribió el texto. */

const COLORES = { cara: 0x5b4bdb, arista: 0xe7ecee, suelo: 0x94a3b8 };

const redondear = valor => Math.round(valor * 100) / 100;

/* Las aristas se dibujan aparte del relleno. Un sólido de color plano se lee
   como una silueta: sin las aristas, un cubo girando parece un hexágono que
   cambia de forma.

   El umbral de 30 grados es lo que separa una arista de verdad de una división
   de la malla. Sin él —el valor por defecto es 1 grado— la esfera salía
   cuadriculada como un globo terráqueo de alambre, porque sus 48×32 divisiones
   contaban todas como aristas. Con 30, el cubo conserva sus doce, el cilindro
   sus dos bordes, y la esfera queda lisa, que es lo que es. */
function conAristas(geometria, color = COLORES.cara) {
  const grupo = new THREE.Group();
  grupo.add(new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({
    color, roughness: .55, metalness: .05, transparent: true, opacity: .85
  })));
  grupo.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(geometria, 30),
    new THREE.LineBasicMaterial({ color: COLORES.arista })
  ));
  return grupo;
}

export const FIGURAS = {
  esfera({ radio = 1 } = {}) {
    const r = Number(radio);
    return {
      objeto: conAristas(new THREE.SphereGeometry(r, 48, 32)),
      medidas: [
        ["Radio", `${redondear(r)} u`],
        ["Diámetro", `${redondear(r * 2)} u`],
        ["Superficie", `${redondear(4 * Math.PI * r ** 2)} u²`],
        ["Volumen", `${redondear((4 / 3) * Math.PI * r ** 3)} u³`]
      ]
    };
  },

  cubo({ lado = 1.6 } = {}) {
    const l = Number(lado);
    return {
      objeto: conAristas(new THREE.BoxGeometry(l, l, l)),
      medidas: [
        ["Arista", `${redondear(l)} u`],
        ["Caras", "6"],
        ["Superficie", `${redondear(6 * l ** 2)} u²`],
        ["Volumen", `${redondear(l ** 3)} u³`]
      ]
    };
  },

  prisma({ ancho = 2, alto = 1, fondo = 1.2 } = {}) {
    const [a, b, c] = [Number(ancho), Number(alto), Number(fondo)];
    return {
      objeto: conAristas(new THREE.BoxGeometry(a, b, c)),
      medidas: [
        ["Aristas", `${redondear(a)} × ${redondear(b)} × ${redondear(c)} u`],
        ["Superficie", `${redondear(2 * (a * b + a * c + b * c))} u²`],
        ["Volumen", `${redondear(a * b * c)} u³`]
      ]
    };
  },

  cilindro({ radio = 1, alto = 2 } = {}) {
    const [r, h] = [Number(radio), Number(alto)];
    return {
      objeto: conAristas(new THREE.CylinderGeometry(r, r, h, 48)),
      medidas: [
        ["Radio", `${redondear(r)} u`],
        ["Altura", `${redondear(h)} u`],
        ["Superficie", `${redondear(2 * Math.PI * r * (r + h))} u²`],
        ["Volumen", `${redondear(Math.PI * r ** 2 * h)} u³`]
      ]
    };
  },

  cono({ radio = 1, alto = 2 } = {}) {
    const [r, h] = [Number(radio), Number(alto)];
    const generatriz = Math.hypot(r, h);
    return {
      objeto: conAristas(new THREE.ConeGeometry(r, h, 48)),
      medidas: [
        ["Radio", `${redondear(r)} u`],
        ["Altura", `${redondear(h)} u`],
        ["Generatriz", `${redondear(generatriz)} u`],
        ["Volumen", `${redondear((Math.PI * r ** 2 * h) / 3)} u³`]
      ]
    };
  },

  piramide({ lado = 1.8, alto = 2 } = {}) {
    const [l, h] = [Number(lado), Number(alto)];
    /* Cuatro lados y girada un octavo de vuelta: sin ese giro, un cono de cuatro
       caras se ve de frente por una arista y parece un triángulo plano. */
    const geometria = new THREE.ConeGeometry(l / Math.SQRT2, h, 4);
    geometria.rotateY(Math.PI / 4);
    return {
      objeto: conAristas(geometria),
      medidas: [
        ["Lado de la base", `${redondear(l)} u`],
        ["Altura", `${redondear(h)} u`],
        ["Área de la base", `${redondear(l ** 2)} u²`],
        ["Volumen", `${redondear((l ** 2 * h) / 3)} u³`]
      ]
    };
  }
};

export const NOMBRES_DE_FIGURA = Object.keys(FIGURAS);

/* Construye una figura por nombre. Devuelve null si no existe, para que quien
   la pida pueda decir «esa figura no existe» en vez de romperse: el nombre viene
   escrito a mano dentro de un markdown y equivocarse es cuestión de tiempo. */
export function crearFigura(nombre, parametros = {}) {
  const constructor = FIGURAS[nombre];
  return constructor ? { nombre, ...constructor(parametros) } : null;
}

/* Luces para que un sólido se lea como un sólido. Con luz plana, una esfera es
   un círculo de color. */
export function iluminar(escena) {
  escena.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.15));
  const principal = new THREE.DirectionalLight(0xffffff, 1.5);
  principal.position.set(3, 5, 4);
  escena.add(principal);
}
