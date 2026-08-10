import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PARADAS, DURACION_TOTAL } from "../universo/app/datos/viaje.js";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

/* Cada parada le pide a la escena un encuadre por su nombre. Un nombre mal
   escrito no rompe nada: la parada se queda muda, la cámara no se mueve y el
   texto habla de algo que no se está viendo. Es el fallo más difícil de notar
   de esta función, así que se comprueba leyendo qué expone la escena.

   Se lee el fuente y no se importa el módulo porque montar la escena necesita
   WebGL, y esto tiene que poder correr en `node --test`. */
const ESCENA = readFileSync(join(RAIZ, "universo/app/escenas/universo.js"), "utf8");

/* Los métodos del objeto que devuelve montarUniverso: `nombre() {` o
   `nombre(algo) {` al principio de una línea indentada. */
function metodosDeLaEscena(fuente) {
  const desde = fuente.lastIndexOf("return {");
  return new Set(
    [...fuente.slice(desde).matchAll(/^\s{4}(\w+)\s*\(/gm)].map(m => m[1])
  );
}

test("cada parada pide un encuadre que la escena tiene", () => {
  const metodos = metodosDeLaEscena(ESCENA);
  assert.ok(metodos.size >= 8, `esperaba varios métodos en la escena, encontré ${metodos.size}`);

  const perdidas = PARADAS.filter(parada => !metodos.has(parada.hacer));
  assert.deepEqual(perdidas.map(p => `${p.id} → ${p.hacer}()`), [],
    "hay paradas que piden un encuadre que la escena no expone: serían paradas mudas");
});

test("el viaje cubre los temas pedidos", () => {
  /* Los ocho de la lista original. Si alguien quita una parada por error, esto
     lo dice; y si se añade un tema nuevo, se añade aquí y se ve qué falta. */
  const temas = [
    /espacio profundo/i, /escalas del universo/i, /viaje del sistema solar/i,
    /ojo humano/i, /coordenadas celestes/i, /constelaciones y planisferio/i,
    /óptica y telescopios/i, /planetas y gravedad/i
  ];
  const titulos = PARADAS.map(p => p.titulo).join(" · ");
  const faltan = temas.filter(tema => !tema.test(titulos));
  assert.deepEqual(faltan.map(String), [], `faltan temas en el viaje: ${titulos}`);
});

test("empieza en la galaxia y acaba en casa", () => {
  // El orden es la mitad de lo que el viaje cuenta: de fuera hacia dentro.
  assert.equal(PARADAS[0].hacer, "enfocarViaLactea");
  assert.equal(PARADAS.at(-1).hacer, "enfocarTierra");
});

test("ninguna parada se queda sin texto ni sin tiempo", () => {
  for (const parada of PARADAS) {
    assert.ok(parada.id && parada.titulo, "cada parada necesita id y título");
    assert.ok(parada.texto.length > 60, `«${parada.id}» tiene el texto demasiado corto`);
    /* Y no demasiado largo: se lee mientras la cámara se mueve. Unos 240
       caracteres son dos frases, que es lo que caben en diez segundos. */
    assert.ok(parada.texto.length < 260, `«${parada.id}» tiene el texto demasiado largo para su tiempo`);
    assert.ok(parada.segundos >= 8 && parada.segundos <= 20,
      `«${parada.id}» dura ${parada.segundos}s: fuera de lo razonable`);
  }
});

test("los identificadores no se repiten", () => {
  const ids = PARADAS.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length, "hay ids repetidos y React los usa como clave");
});

test("el viaje entero dura entre dos y tres minutos", () => {
  /* Suficiente para contar algo y poco para que nadie se vaya antes. Si crece,
     conviene decidirlo a propósito y no por acumulación. */
  assert.ok(DURACION_TOTAL >= 100 && DURACION_TOTAL <= 180,
    `el viaje dura ${DURACION_TOTAL} segundos`);
});
