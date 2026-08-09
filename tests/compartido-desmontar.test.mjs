import { test } from "node:test";
import assert from "node:assert/strict";
import { liberarEscena } from "../compartido/desmontar.js";

/* Se prueba con objetos falsos y no con Three.js de verdad: lo que puede
   fallar aquí es el recorrido —el material que viene en un array, la textura
   escondida dentro de un uniforme— y eso no necesita tarjeta gráfica. La parte
   que sí la necesita, perder el contexto WebGL, se comprueba en el navegador. */

const espia = () => {
  const objeto = { liberado: 0, dispose() { objeto.liberado++; } };
  return objeto;
};

/* Un grafo de mentira con la misma forma que uno de Three.js: `traverse` visita
   el nodo y sus hijos, y `clear` vacía la lista. */
function nodo({ geometry, material, children = [] } = {}) {
  const self = {
    geometry, material, children,
    traverse(visitar) { visitar(self); children.forEach(hijo => hijo.traverse(visitar)); },
    clear() { self.children = []; }
  };
  return self;
}

test("libera geometrías y materiales de todo el grafo", () => {
  const g1 = espia(), g2 = espia(), m1 = espia(), m2 = espia();
  const escena = nodo({ children: [nodo({ geometry: g1, material: m1, children: [nodo({ geometry: g2, material: m2 })] })] });

  const cuenta = liberarEscena(escena);

  assert.equal(g1.liberado, 1);
  assert.equal(g2.liberado, 1);
  assert.equal(m1.liberado, 1);
  assert.equal(m2.liberado, 1);
  assert.deepEqual(cuenta, { geometrias: 2, materiales: 2 });
});

test("un material compartido se libera una sola vez", () => {
  /* Liberar dos veces el mismo material lanza en algunas versiones de Three y,
     peor, esconde que la cuenta está mal. Los planetas comparten material entre
     el cuerpo y sus lunas. */
  const compartido = espia();
  const escena = nodo({ children: [nodo({ material: compartido }), nodo({ material: compartido })] });

  const cuenta = liberarEscena(escena);

  assert.equal(compartido.liberado, 1);
  assert.equal(cuenta.materiales, 1);
});

test("libera los materiales cuando vienen en un array", () => {
  // Un mesh con varios grupos de caras tiene un material por grupo.
  const a = espia(), b = espia();
  const escena = nodo({ children: [nodo({ material: [a, b] })] });

  liberarEscena(escena);

  assert.equal(a.liberado, 1);
  assert.equal(b.liberado, 1);
});

test("libera las texturas colgadas del material", () => {
  const mapa = espia(), normales = espia();
  const material = { map: mapa, normalMap: normales, liberado: 0, dispose() { material.liberado++; } };
  const escena = nodo({ children: [nodo({ material })] });

  liberarEscena(escena);

  assert.equal(mapa.liberado, 1, "el mapa de color se quedó en la tarjeta");
  assert.equal(normales.liberado, 1, "el mapa de normales se quedó en la tarjeta");
  assert.equal(material.liberado, 1);
});

test("libera las texturas escondidas dentro de los uniformes de un shader", () => {
  /* Es el caso de la superficie estelar del universo: su textura no es una
     propiedad del material, cuelga de uniforms.loquesea.value, donde un barrido
     por las propiedades del material no llega. */
  const textura = espia();
  const material = {
    uniforms: { uMapa: { value: textura }, uTime: { value: 0 } },
    liberado: 0, dispose() { material.liberado++; }
  };
  const escena = nodo({ children: [nodo({ material })] });

  liberarEscena(escena);

  assert.equal(textura.liberado, 1, "la textura del shader se quedó en la tarjeta");
});

test("vacía el grafo, para que no quede nada referenciado", () => {
  const escena = nodo({ children: [nodo({ geometry: espia() })] });
  liberarEscena(escena);
  assert.deepEqual(escena.children, []);
});

test("no revienta con una escena vacía ni con nada", () => {
  assert.deepEqual(liberarEscena(nodo()), { geometrias: 0, materiales: 0 });
  assert.deepEqual(liberarEscena(null), { geometrias: 0, materiales: 0 });
  assert.deepEqual(liberarEscena({}), { geometrias: 0, materiales: 0 });
});

test("un uniforme sin valor no lo tumba", () => {
  const material = { uniforms: { uNada: {}, uNulo: { value: null } }, dispose() {} };
  const escena = nodo({ children: [nodo({ material })] });
  assert.doesNotThrow(() => liberarEscena(escena));
});
