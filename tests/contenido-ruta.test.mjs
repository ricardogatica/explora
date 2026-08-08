import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { traducirPractica, traducirDiagnostico } from "../contenido/legado.js";
import { BANDAS } from "../contenido/bandas.js";

/* Una ruta con huecos no es una ruta.

   Estos tests no exigen que todo esté cubierto —el contenido está por escribir—
   pero sí que el hueco sea VISIBLE. Un tramo vacío no se nota navegando: se nota
   cuando alguien busca qué le toca a su hijo de 6 años y no encuentra nada, y
   para entonces ya se escribieron cien páginas en los tramos equivocados. */

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const leer = ruta => JSON.parse(readFileSync(join(RAIZ, ruta), "utf8"));

const PREGUNTAS = [
  ...leer("matematicas/data/practice.json").map(p => traducirPractica(p, "matematicas")),
  ...leer("matematicas/data/diagnostics.json").map(p => traducirDiagnostico(p, "matematicas")),
  ...leer("lenguaje/data/exercises.json").map(p => traducirPractica(p, "lenguaje"))
];

const cuentaPorBanda = preguntas => {
  const cuenta = new Map(BANDAS.map(b => [b.id, 0]));
  for (const p of preguntas) {
    if (cuenta.has(p.banda)) cuenta.set(p.banda, cuenta.get(p.banda) + 1);
  }
  return cuenta;
};

/* Huecos de contenido conocidos, declarados a propósito.

   Al escribir este test la banda 5-6 estaba vacía en las dos materias. Eso no es
   un fallo del código ni algo que se arregle reetiquetando lo que ya hay: es
   contenido que falta y hay que escribir, y taparlo moviendo preguntas de 7-8
   sería mentirle a un padre sobre qué le toca a su hijo de cinco años.

   Se declara aquí en vez de dejar el test en rojo, que acabaría ignorándose. La
   lista funciona en los dos sentidos: si aparece un hueco nuevo, el test falla; y
   si alguien escribe el contenido que falta y no borra la entrada, también. Así
   la deuda no se queda escrita para siempre. */
const HUECOS_DECLARADOS = ["5-6"];

test("los huecos de la ruta son exactamente los declarados", () => {
  const cuenta = cuentaPorBanda(PREGUNTAS);
  const vacias = [...cuenta].filter(([, n]) => n === 0).map(([id]) => id);

  const nuevos = vacias.filter(id => !HUECOS_DECLARADOS.includes(id));
  assert.deepEqual(nuevos, [],
    `bandas que se han quedado sin contenido: ${nuevos.join(", ")}. ` +
    "Hay que escribirlo, no reetiquetar lo que hay para taparlo.");

  const cubiertos = HUECOS_DECLARADOS.filter(id => !vacias.includes(id));
  assert.deepEqual(cubiertos, [],
    `${cubiertos.join(", ")} ya tiene contenido: quítalo de HUECOS_DECLARADOS ` +
    "para que el hueco siguiente se siga viendo.");
});

test("el reparto por banda y materia queda a la vista", () => {
  /* Este test no falla casi nunca: existe para imprimir el mapa cuando algo más
     falla, y para que el desequilibrio se vea en el informe en lugar de
     descubrirse a mitad de la fase 2. */
  const materias = [...new Set(PREGUNTAS.map(p => p.materia))].sort();
  const filas = BANDAS.map(banda => {
    const porMateria = materias.map(materia =>
      `${materia}: ${PREGUNTAS.filter(p => p.banda === banda.id && p.materia === materia).length}`
    );
    return `  ${banda.id.padEnd(6)} ${porMateria.join("  ")}`;
  });
  const previo = PREGUNTAS.filter(p => p.banda === "previo").length;
  console.log(`\nreparto de las ${PREGUNTAS.length} preguntas por banda:\n${filas.join("\n")}` +
    `\n  previo ${previo} (fuera de la ruta)\n`);

  assert.ok(PREGUNTAS.length > 0);
  assert.equal(
    PREGUNTAS.filter(p => p.banda).length, PREGUNTAS.length,
    "hay preguntas sin banda, así que el reparto miente"
  );
});

test("cada materia llega al menos a la mitad de las bandas", () => {
  /* Una materia concentrada en un tramo no sirve para acompañar a un niño que
     crece: la ruta la perdería por el camino. Es un listón mínimo, no una meta. */
  const materias = [...new Set(PREGUNTAS.map(p => p.materia))];
  for (const materia of materias) {
    const cubiertas = BANDAS.filter(banda =>
      PREGUNTAS.some(p => p.materia === materia && p.banda === banda.id)
    ).length;
    assert.ok(
      cubiertas >= Math.ceil(BANDAS.length / 2),
      `${materia} solo aparece en ${cubiertas} de ${BANDAS.length} bandas`
    );
  }
});
