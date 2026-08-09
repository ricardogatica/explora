import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validarCorpus, MATERIAS } from "../contenido/esquema.js";
import { separarFrontmatter, validarPagina } from "../contenido/paginas.js";
import { IDS_VALIDOS } from "../contenido/bandas.js";

/* Estos tests corren contra el contenido REAL, no contra ejemplos. Es la
   diferencia entre saber que el validador funciona y saber que el contenido está
   bien: lo primero ya lo comprueba contenido-esquema.test.mjs. */

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const leer = ruta => JSON.parse(readFileSync(join(RAIZ, ruta), "utf8"));

const CORPUS = ["lenguaje", "matematicas"].map(materia => ({
  archivo: `contenido/${materia}/preguntas.json`,
  preguntas: leer(`contenido/${materia}/preguntas.json`)
}));

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

test("cada página es un archivo con su metadata dentro", () => {
  /* Antes eran dos: el texto en pages/ y el título en un manifiesto. Añadir una
     página obligaba a escribir en dos sitios, y olvidarse del segundo la dejaba
     invisible sin dar ningún error. */
  const fallos = [];
  let revisadas = 0;
  for (const materia of ["lenguaje", "matematicas"]) {
    const carpeta = join(RAIZ, "contenido", materia, "paginas");
    for (const nombre of readdirSync(carpeta).filter(n => n.endsWith(".md"))) {
      revisadas++;
      const { meta, cuerpo, tieneFrontmatter } = separarFrontmatter(
        readFileSync(join(carpeta, nombre), "utf8")
      );
      const pagina = { id: nombre.replace(/\.md$/, ""), ...meta };
      if (!tieneFrontmatter) fallos.push(`${materia}/${nombre}: sin frontmatter`);
      if (!cuerpo.trim()) fallos.push(`${materia}/${nombre}: sin texto`);
      if (meta.materia !== materia) {
        fallos.push(`${materia}/${nombre}: dice ser de «${meta.materia}»`);
      }
      fallos.push(...validarPagina(pagina, { materias: MATERIAS, bandasValidas: IDS_VALIDOS })
        .map(f => `${materia}/${nombre}: ${f.mensaje}`));
    }
  }
  assert.deepEqual(fallos, [], fallos.join("\n"));
  assert.equal(revisadas, 31, `esperaba 31 páginas, hay ${revisadas}`);
});

test("las páginas con banda apuntan a tramos que existen", () => {
  // Las 7 sin banda son guías generales —«Inicio», «Cómo evaluar»— y es correcto
  // que no tengan: no son contenido de una edad.
  let conBanda = 0;
  for (const materia of ["lenguaje", "matematicas"]) {
    const carpeta = join(RAIZ, "contenido", materia, "paginas");
    for (const nombre of readdirSync(carpeta).filter(n => n.endsWith(".md"))) {
      const { meta } = separarFrontmatter(readFileSync(join(carpeta, nombre), "utf8"));
      if (!meta.bandas?.length) continue;
      conBanda++;
      for (const banda of meta.bandas) {
        assert.ok(IDS_VALIDOS.includes(banda), `${materia}/${nombre} apunta a la banda «${banda}»`);
      }
    }
  }
  assert.ok(conBanda >= 20, `esperaba al menos 20 páginas con banda, hay ${conBanda}`);
});

test("no queda rastro del formato viejo", () => {
  /* Ni los directorios de las dos materias anteriores, ni el adaptador que
     traducía su formato, ni campos en inglés dentro de las preguntas. Si algo de
     esto vuelve, es que hay dos verdades otra vez. */
  for (const resto of ["lenguaje/data", "matematicas/data", "contenido/legado.js"]) {
    assert.equal(existsSync(join(RAIZ, resto)), false, `${resto} debería haber desaparecido`);
  }
  for (const pregunta of TODAS) {
    for (const campo of ["level", "category", "answer", "options", "explanation", "skill"]) {
      assert.ok(!(campo in pregunta), `«${pregunta.id}» conserva el campo viejo «${campo}»`);
    }
  }
});
