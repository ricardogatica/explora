import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validarCorpus } from "../contenido/esquema.js";
import { traducirPractica, traducirDiagnostico } from "../contenido/legado.js";
import { BANDAS, esBandaDeRuta } from "../contenido/bandas.js";
import { BANDA_POR_NIVEL_VIEJO, BANDA_POR_CATEGORIA_DE_LENGUAJE } from "../contenido/migracion-niveles.js";

/* Estos tests corren contra el contenido REAL, no contra ejemplos. Es la
   diferencia entre saber que el validador funciona y saber que el contenido está
   bien: lo primero ya lo comprueba contenido-esquema.test.mjs. */

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const leer = ruta => JSON.parse(readFileSync(join(RAIZ, ruta), "utf8"));

const CORPUS = [
  {
    archivo: "matematicas/data/practice.json",
    preguntas: leer("matematicas/data/practice.json").map(p => traducirPractica(p, "matematicas"))
  },
  {
    archivo: "matematicas/data/diagnostics.json",
    preguntas: leer("matematicas/data/diagnostics.json").map(p => traducirDiagnostico(p, "matematicas"))
  },
  {
    archivo: "lenguaje/data/exercises.json",
    preguntas: leer("lenguaje/data/exercises.json").map(p => traducirPractica(p, "lenguaje"))
  }
];

const TODAS = CORPUS.flatMap(a => a.preguntas);

test("el contenido real cumple el contrato", () => {
  const { fallos, revisadas } = validarCorpus(CORPUS, { contar: true });
  assert.equal(
    fallos.length, 0,
    `${fallos.length} problemas en el contenido:\n` +
    fallos.map(f => `  [${f.regla}] ${f.mensaje}`).join("\n")
  );
  // Sin esto, un corpus vacío por una ruta mal escrita también daría cero fallos.
  assert.equal(revisadas, 57, `esperaba 57 preguntas, se revisaron ${revisadas}`);
});

test("ninguna pregunta se queda sin banda", () => {
  /* Es el dato que hace posible la ruta de 5 a 17. Las 17 de lenguaje no tenían
     ninguno: si el mapa por categoría se queda corto, aquí se ve. */
  const huerfanas = TODAS.filter(p => !p.banda);
  assert.deepEqual(
    huerfanas.map(p => p.id), [],
    "hay preguntas sin banda: falta su nivel viejo o su categoría en migracion-niveles.js"
  );
});

test("el mapa de niveles viejos cubre todos los que existen en el contenido", () => {
  const usados = new Set([
    ...leer("matematicas/data/practice.json").map(p => p.level),
    ...leer("matematicas/data/diagnostics.json").map(p => p.level)
  ].filter(Boolean));
  for (const nivel of usados) {
    assert.ok(BANDA_POR_NIVEL_VIEJO[nivel],
      `el nivel viejo «${nivel}» aparece en el contenido y no está en el mapa`);
  }
});

test("el mapa de categorías de lenguaje cubre todas las que existen", () => {
  const usadas = new Set(leer("lenguaje/data/exercises.json").map(p => p.category));
  for (const categoria of usadas) {
    assert.ok(BANDA_POR_CATEGORIA_DE_LENGUAJE[categoria],
      `la categoría «${categoria}» de lenguaje no tiene banda asignada`);
  }
});

test("el mapa de lenguaje no tiene categorías que ya no existan", () => {
  // Una entrada sobrante es contenido que se borró y una asignación que quedó
  // huérfana: parece que algo está cubierto cuando no lo está.
  const usadas = new Set(leer("lenguaje/data/exercises.json").map(p => p.category));
  for (const categoria of Object.keys(BANDA_POR_CATEGORIA_DE_LENGUAJE)) {
    assert.ok(usadas.has(categoria),
      `«${categoria}» está en el mapa pero ninguna pregunta la usa`);
  }
});

test("todas las bandas asignadas son bandas que existen", () => {
  const validas = new Set([...BANDAS.map(b => b.id), "previo"]);
  for (const [nivel, banda] of Object.entries(BANDA_POR_NIVEL_VIEJO)) {
    assert.ok(validas.has(banda), `${nivel} apunta a la banda «${banda}», que no existe`);
  }
  for (const [categoria, banda] of Object.entries(BANDA_POR_CATEGORIA_DE_LENGUAJE)) {
    assert.ok(validas.has(banda), `«${categoria}» apunta a la banda «${banda}», que no existe`);
  }
});

test("el contenido de 1 a 5 años queda marcado como previo y no dentro de la ruta", () => {
  // Son las páginas de matemáticas para 1-3 y 3-5 años: se conservan, pero fuera
  // de la progresión, porque la ruta empieza a los 5.
  assert.equal(BANDA_POR_NIVEL_VIEJO["nivel-1-3"], "previo");
  assert.equal(BANDA_POR_NIVEL_VIEJO["nivel-3-5"], "previo");
  assert.equal(esBandaDeRuta("previo"), false);
  assert.ok(TODAS.some(p => p.banda === "previo"), "debería quedar contenido previo");
});

test("las aplicaciones actuales siguen leyendo su formato", () => {
  /* La traducción es de solo lectura: los archivos no se tocan en esta fase, y
     los dos sitios en producción siguen filtrando por `level` y `category`. */
  const practica = leer("matematicas/data/practice.json");
  assert.ok(practica.every(p => "level" in p && "category" in p && "answer" in p),
    "los archivos originales han cambiado de forma: eso rompe matematicas/assets/app.js");
  const lenguaje = leer("lenguaje/data/exercises.json");
  assert.ok(lenguaje.every(p => "category" in p && "answer" in p),
    "los archivos originales han cambiado de forma: eso rompe lenguaje/assets/app.js");
});
