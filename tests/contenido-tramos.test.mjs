import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { separarFrontmatter } from "../contenido/paginas.js";
import { esBandaDeRuta } from "../contenido/bandas.js";

/* Las tarjetas del final de una página llevan a las demás del mismo tramo de edad.

   La lógica vive en materias/lib/contenido.js, que no se puede importar aquí: lee el
   contenido con process.cwd() y depende de marked, así que importarlo obligaría a
   montar el build para comprobar una relación entre archivos. Se rehace la misma
   consulta sobre el contenido y se comprueba lo que tiene que cumplir. */

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

const MATERIAS = readdirSync(join(RAIZ, "contenido"), { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => e.name)
  .filter(n => existsSync(join(RAIZ, "contenido", n, "preguntas.json")))
  .sort();

const PAGINAS = MATERIAS.flatMap(materia => {
  const carpeta = join(RAIZ, "contenido", materia, "paginas");
  return readdirSync(carpeta).filter(n => n.endsWith(".md")).map(nombre => {
    const { meta } = separarFrontmatter(readFileSync(join(carpeta, nombre), "utf8"));
    return { materia, id: nombre.replace(/\.md$/, ""), ...meta, bandas: meta.bandas ?? [] };
  });
});

const hermanas = pagina => PAGINAS.filter(otra =>
  !(otra.materia === pagina.materia && otra.id === pagina.id) &&
  otra.bandas.some(banda => pagina.bandas.includes(banda))
);

test("las páginas de nivel son informativas y no entran en la vista por edad", () => {
  /* Son tablas de referencia sobre qué se espera a cada edad, escritas antes de que
     existieran las bandas. Quien lleva a los contenidos de un tramo es la vista por
     edad —/materia/edad/9-10/—, no ellas, así que no declaran banda: si la
     declararan, cada tramo empezaría con una tabla en vez de con su contenido. */
  const niveles = PAGINAS.filter(p => p.id.startsWith("nivel-"));
  assert.ok(niveles.length >= 6, `esperaba las páginas de nivel, encontré ${niveles.length}`);

  const conBanda = niveles.filter(n => n.bandas.length);
  assert.deepEqual(conBanda.map(n => `${n.materia}/${n.id} [${n.bandas}]`), [],
    "una página de nivel volvió a declarar banda");
});

test("una página nunca se enlaza a sí misma", () => {
  for (const pagina of PAGINAS.filter(p => p.bandas.length)) {
    const propia = hermanas(pagina).filter(o => o.materia === pagina.materia && o.id === pagina.id);
    assert.equal(propia.length, 0, `${pagina.materia}/${pagina.id} aparece entre sus hermanas`);
  }
});

test("una página en dos tramos aparece una sola vez", () => {
  /* Con dos bandas compartidas, un filtro ingenuo la devolvería dos veces y React
     avisaría de claves repetidas… o no, y saldría duplicada en silencio. */
  for (const pagina of PAGINAS.filter(p => p.bandas.length > 1)) {
    const lista = hermanas(pagina).map(o => `${o.materia}/${o.id}`);
    assert.equal(new Set(lista).size, lista.length, `${pagina.id} repite alguna hermana`);
  }
});

test("un tramo cruza materias, que es para lo que sirve", () => {
  /* Una banda de edad atraviesa el sitio: si las hermanas de una página de
     matemáticas fueran solo de matemáticas, esto no aportaría nada sobre el
     buscador de la propia materia. Se mira el tramo, no una página concreta: atarlo
     a un archivo lo rompe cuando ese archivo cambia, que es lo que pasó. */
  const materias = new Set(PAGINAS.filter(p => p.bandas.includes("10-11")).map(p => p.materia));
  assert.ok(materias.size >= 3,
    `el tramo 9-10 solo toca ${[...materias].join(", ")}`);
});

test("toda banda que declara una página tiene página de ruta", () => {
  /* La regla nació con «previo», que llevaba contenido y no tenía /ruta/<id>/: quien
     pintaba ese enlace daba un 404. Ahora las siete bandas son de la ruta, así que lo
     que hay que vigilar es que ninguna página se etiquete con algo que no lo sea. */
  const invalidas = [];
  for (const pagina of PAGINAS) {
    for (const banda of pagina.bandas) {
      if (!esBandaDeRuta(banda)) invalidas.push(`${pagina.materia}/${pagina.id} → ${banda}`);
    }
  }
  assert.deepEqual(invalidas, [], "hay páginas etiquetadas con una banda que no existe");
});

test("toda página con banda tiene descripción, que es lo que se lee en la tarjeta", () => {
  const sinDescripcion = PAGINAS.filter(p => p.bandas.length && !p.descripcion);
  assert.deepEqual(sinDescripcion.map(p => `${p.materia}/${p.id}`), [],
    "hay páginas sin descripción: su tarjeta saldría con el título y un hueco");
});
