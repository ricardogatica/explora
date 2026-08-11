import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validarCorpus, MATERIAS } from "../contenido/esquema.js";
import { separarFrontmatter, validarPagina } from "../contenido/paginas.js";
import { IDS_VALIDOS, BANDAS } from "../contenido/bandas.js";

/* Estos tests corren contra el contenido REAL, no contra ejemplos. Es la
   diferencia entre saber que el validador funciona y saber que el contenido está
   bien: lo primero ya lo comprueba contenido-esquema.test.mjs. */

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const leer = ruta => JSON.parse(readFileSync(join(RAIZ, ruta), "utf8"));

/* Las materias se descubren, no se listan.

   Antes estaban escritas a mano aquí, y eso convertía cada materia nueva en un
   test que se cae por un motivo que no es un error: el contenido está bien y la
   lista está vieja. Peor todavía, el fallo es silencioso al revés —una materia
   que se añade y no se apunta aquí queda sin validar, y una pregunta mal formada
   suya llega a producción—. Se descubren por lo único que las define de verdad:
   tener un preguntas.json. */
const MATERIAS_CON_CONTENIDO = readdirSync(join(RAIZ, "contenido"), { withFileTypes: true })
  .filter(entrada => entrada.isDirectory())
  .map(entrada => entrada.name)
  .filter(nombre => existsSync(join(RAIZ, "contenido", nombre, "preguntas.json")))
  .sort();

const CORPUS = MATERIAS_CON_CONTENIDO.map(materia => ({
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
  /* Sin esto, un corpus vacío por una ruta mal escrita también daría cero fallos.
     Es un mínimo y no una igualdad: crece cada vez que se escribe contenido, y una
     igualdad haría fallar el test por añadir preguntas buenas. Lo que vigila es que
     el corpus no se quede en nada. */
  assert.ok(revisadas >= 100, `esperaba al menos 100 preguntas, se revisaron ${revisadas}`);
  assert.ok(MATERIAS_CON_CONTENIDO.length >= 3,
    `esperaba al menos tres materias con preguntas, encontré ${MATERIAS_CON_CONTENIDO.join(", ")}`);
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
  for (const materia of MATERIAS_CON_CONTENIDO) {
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
  assert.ok(revisadas >= 40, `esperaba al menos 40 páginas, hay ${revisadas}`);
});

test("las páginas con banda apuntan a tramos que existen", () => {
  // Las 7 sin banda son guías generales —«Inicio», «Cómo evaluar»— y es correcto
  // que no tengan: no son contenido de una edad.
  let conBanda = 0;
  for (const materia of MATERIAS_CON_CONTENIDO) {
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
  assert.ok(conBanda >= 30, `esperaba al menos 30 páginas con banda, hay ${conBanda}`);
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

test("toda materia con contenido está registrada en la aplicación", () => {
  /* El fallo que este test existe para cazar: se escribe una materia entera en
     contenido/ y nadie la añade al catálogo de la aplicación. No falla nada. No
     avisa nada. La materia simplemente no aparece en el portal, no tiene página,
     no entra en la ruta por edad y sus preguntas no se practican nunca.

     Se lee el fuente en vez de importarlo porque el módulo resuelve el contenido
     con process.cwd() y depende de marked: importarlo aquí obligaría a montar el
     build entero para comprobar una lista. */
  const fuente = readFileSync(join(RAIZ, "materias/lib/contenido.js"), "utf8");
  const registradas = [...fuente.matchAll(/slug:\s*"([\w-]+)"/g)].map(m => m[1]).sort();

  assert.deepEqual(registradas, MATERIAS_CON_CONTENIDO,
    "el catálogo de la aplicación y el contenido en disco no coinciden: " +
    "una materia registrada sin contenido rompe el build, y una con contenido sin " +
    "registrar queda invisible");
});

test("ninguna banda de la ruta se queda sin preguntas", () => {
  /* La ruta de 5 a 17 años es la promesa del proyecto, y una banda vacía la rompe
     en silencio: la página del tramo existe, se abre y no hay nada dentro. Pasó de
     verdad con la banda de 5-6, que estuvo vacía hasta que se escribió física. */
  const vacias = BANDAS.filter(banda => !TODAS.some(p => p.banda === banda.id));
  assert.deepEqual(vacias.map(b => b.id), [],
    "hay tramos de edad sin una sola pregunta: su página de ruta se abre vacía");
});
