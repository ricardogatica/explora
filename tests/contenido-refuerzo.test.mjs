import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { separarFrontmatter, validarPagina } from "../contenido/paginas.js";
import { BANDAS, PREVIO, bandaPorId } from "../contenido/bandas.js";
import { MATERIAS as MATERIAS_VALIDAS } from "../contenido/esquema.js";

/* «Si algo se te hace difícil, vuelve a lo de antes.»

   La deducción vive en materias/lib/contenido.js, que no se puede importar aquí
   —lee el contenido con process.cwd() y depende de marked—, así que se rehace la
   misma regla sobre los archivos y se comprueba lo que tiene que cumplir. Lo que
   se vigila no es la implementación sino la promesa: que lo que se propone repasar
   esté de verdad antes. */

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

const MATERIAS = readdirSync(join(RAIZ, "contenido"), { withFileTypes: true })
  .filter(e => e.isDirectory()).map(e => e.name)
  .filter(n => existsSync(join(RAIZ, "contenido", n, "preguntas.json"))).sort();

const PAGINAS = MATERIAS.flatMap(materia => {
  const carpeta = join(RAIZ, "contenido", materia, "paginas");
  return readdirSync(carpeta).filter(n => n.endsWith(".md")).map(nombre => {
    const { meta } = separarFrontmatter(readFileSync(join(carpeta, nombre), "utf8"));
    return { materia, id: nombre.replace(/\.md$/, ""), ...meta, bandas: meta.bandas ?? [] };
  });
});

const edadDe = pagina => Math.min(...pagina.bandas.map(b => bandaPorId(b)?.desde ?? Infinity));

/* La misma regla que aplica la aplicación: lo declarado manda, y si no, lo que esté
   en un tramo anterior sin pasarse de dos tramos hacia atrás. */
function refuerzo(pagina) {
  const deLaMateria = PAGINAS.filter(p => p.materia === pagina.materia);
  if (pagina.refuerzo?.length) {
    return pagina.refuerzo.map(id => deLaMateria.find(p => p.id === id)).filter(Boolean);
  }
  if (!pagina.bandas.length) return [];
  const suya = edadDe(pagina);
  return deLaMateria
    .filter(p => p.id !== pagina.id && p.bandas.length)
    .filter(p => edadDe(p) < suya && edadDe(p) >= suya - 4)
    .slice(0, 3);
}

test("lo que se propone repasar está siempre en una edad anterior", () => {
  /* Es la promesa entera. Una versión anterior deducía «lo anterior por orden en la
     misma categoría» y proponía Electricidad y magnetismo para repasar Óptica —del
     mismo tramo, sin relación— y Números racionales para Potencias, que es dos años
     posterior. Mandar a alguien atascado hacia adelante es peor que no mandarlo. */
  const malos = [];
  for (const pagina of PAGINAS.filter(p => p.bandas.length && !p.refuerzo?.length)) {
    for (const otra of refuerzo(pagina)) {
      if (edadDe(otra) >= edadDe(pagina)) {
        malos.push(`${pagina.materia}/${pagina.id} [${pagina.bandas}] → ${otra.id} [${otra.bandas}]`);
      }
    }
  }
  assert.deepEqual(malos, [], "hay refuerzos que apuntan a contenido igual o posterior");
});

test("no se manda a nadie más de dos tramos atrás", () => {
  // Reforzar es volver un poco. A quien se le atascan las potencias a los nueve
  // años no le sirve la página de los tres.
  for (const pagina of PAGINAS.filter(p => p.bandas.length && !p.refuerzo?.length)) {
    for (const otra of refuerzo(pagina)) {
      assert.ok(edadDe(otra) >= edadDe(pagina) - 4,
        `${pagina.id} manda a ${otra.id}, que está ${edadDe(pagina) - edadDe(otra)} años atrás`);
    }
  }
});

test("el primer tramo de cada materia no propone nada, y eso está bien", () => {
  /* Antes del principio no hay nada, y un bloque vacío diciendo «repasa» sería peor
     que no mostrarlo. La interfaz lo oculta cuando la lista viene vacía. */
  const primeras = PAGINAS.filter(p => p.bandas.includes(BANDAS[0].id));
  assert.ok(primeras.length > 0, "esperaba páginas en el primer tramo");
  for (const pagina of primeras.filter(p => !p.refuerzo?.length)) {
    const previas = refuerzo(pagina).filter(o => !o.bandas.includes(PREVIO.id));
    assert.deepEqual(previas, [], `${pagina.id} propone repasar algo del mismo tramo o posterior`);
  }
});

test("una página nunca se propone a sí misma", () => {
  for (const pagina of PAGINAS.filter(p => p.bandas.length)) {
    assert.ok(!refuerzo(pagina).some(o => o.id === pagina.id), `${pagina.id} se refuerza consigo misma`);
  }
});

test("el orden de las páginas sigue la progresión de edad", () => {
  /* Dentro de una categoría, `orden` y las bandas contaban cosas distintas: en
     «Números y operaciones» Potencias iba a los 9 años y estaba listada después de
     Números racionales, que es de 11. La lista decía una progresión y el contenido
     otra. */
  const desordenadas = [];
  for (const materia of MATERIAS) {
    const porCategoria = new Map();
    for (const pagina of PAGINAS.filter(p => p.materia === materia && p.bandas.length)) {
      if (!porCategoria.has(pagina.categoria)) porCategoria.set(pagina.categoria, []);
      porCategoria.get(pagina.categoria).push(pagina);
    }
    for (const [categoria, paginas] of porCategoria) {
      const enOrden = [...paginas].sort((a, b) => Number(a.orden) - Number(b.orden));
      for (let i = 1; i < enOrden.length; i++) {
        if (edadDe(enOrden[i]) < edadDe(enOrden[i - 1])) {
          desordenadas.push(`${materia}/${categoria}: ${enOrden[i].id} [${enOrden[i].bandas}] va tras ${enOrden[i - 1].id} [${enOrden[i - 1].bandas}]`);
        }
      }
    }
  }
  assert.deepEqual(desordenadas, [], "hay categorías donde el orden contradice las edades");
});

test("un refuerzo declarado tiene que existir y no puede ser circular", () => {
  /* Un enlace muerto donde alguien atascado esperaba ayuda es el peor sitio para
     tenerlo, y no da ningún error al construir si nadie lo comprueba. */
  for (const materia of MATERIAS) {
    const ids = PAGINAS.filter(p => p.materia === materia).map(p => p.id);
    for (const pagina of PAGINAS.filter(p => p.materia === materia)) {
      const fallos = validarPagina(pagina, {
        materias: MATERIAS_VALIDAS,
        bandasValidas: [...BANDAS.map(b => b.id), PREVIO.id],
        idsDeLaMateria: ids
      });
      assert.deepEqual(fallos.map(f => f.mensaje), [], `${materia}/${pagina.id}`);
    }
  }
});

test("el validador caza un refuerzo inventado y uno circular", () => {
  // Mutación: sin esto, las dos reglas de arriba podrían no comprobar nada.
  const base = { id: "x", titulo: "X", materia: "matematicas", categoria: "C", bandas: [] };
  const contexto = { materias: MATERIAS_VALIDAS, bandasValidas: ["9-10"], idsDeLaMateria: ["x", "y"] };

  const inventado = validarPagina({ ...base, refuerzo: ["no-existe"] }, contexto);
  assert.equal(inventado.length, 1);
  assert.equal(inventado[0].regla, "refuerzo-inexistente");

  const circular = validarPagina({ ...base, refuerzo: ["x"] }, contexto);
  assert.equal(circular[0].regla, "refuerzo-circular");

  assert.deepEqual(validarPagina({ ...base, refuerzo: ["y"] }, contexto), []);
});
