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

test("las páginas de nivel tienen a dónde llevar", () => {
  /* Es el motivo de esta función: describían un tramo de edad y no enlazaban a
     nada, así que quien entraba tenía que volver atrás y buscar a mano. */
  const niveles = PAGINAS.filter(p => p.id.startsWith("nivel-"));
  assert.ok(niveles.length >= 6, `esperaba las páginas de nivel, encontré ${niveles.length}`);

  for (const nivel of niveles) {
    assert.ok(nivel.bandas.length > 0, `${nivel.materia}/${nivel.id} no declara banda`);
    assert.ok(hermanas(nivel).length > 0,
      `${nivel.materia}/${nivel.id} no tiene ninguna página hermana: su bloque saldría vacío`);
  }
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

test("el tramo cruza materias, que es para lo que sirve", () => {
  /* Una banda de edad atraviesa el sitio: si las hermanas de una página de
     matemáticas fueran solo de matemáticas, esto no aportaría nada sobre el
     buscador de la propia materia. */
  const nivel = PAGINAS.find(p => p.id === "nivel-9-11");
  assert.ok(nivel, "falta contenido/matematicas/paginas/nivel-9-11.md");
  const materias = new Set(hermanas(nivel).map(o => o.materia));
  assert.ok(materias.size >= 3,
    `el tramo de nivel-9-11 solo toca ${[...materias].join(", ")}`);
});

test("solo se enlaza la ruta de los tramos que tienen página", () => {
  /* «previo» no está en la progresión y no tiene página propia: enlazar a
     /ruta/previo/ daría un 404 en un sitio que se sirve como archivos. */
  assert.equal(esBandaDeRuta("previo"), false);
  const previas = PAGINAS.filter(p => p.bandas.includes("previo"));
  assert.ok(previas.length > 0, "esperaba páginas en el tramo previo");
  for (const pagina of previas) {
    const conRuta = pagina.bandas.filter(esBandaDeRuta);
    assert.ok(!conRuta.includes("previo"), `${pagina.id} enlazaría /ruta/previo/`);
  }
});

test("toda página con banda tiene descripción, que es lo que se lee en la tarjeta", () => {
  const sinDescripcion = PAGINAS.filter(p => p.bandas.length && !p.descripcion);
  assert.deepEqual(sinDescripcion.map(p => `${p.materia}/${p.id}`), [],
    "hay páginas sin descripción: su tarjeta saldría con el título y un hueco");
});
