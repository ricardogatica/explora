import { test } from "node:test";
import assert from "node:assert/strict";
import { BANDAS, PREVIO, bandaPorId, bandaDeEdad, esBandaDeRuta } from "../contenido/bandas.js";

/* Las bandas son la columna vertebral de la ruta de aprendizaje: cada página y
   cada pregunta lleva una. Si no particionan las edades, la ruta tiene huecos o
   contenido duplicado, y eso no se ve mirando el sitio: se ve cuando un padre
   busca qué toca a los 6 años y no hay nada.

   Las bandas viejas de matemáticas eran 1-3, 3-5, 6-8, 9-11, 12-14 y 15-17: los
   3 años caían en dos tramos y entre los 5 y los 6 no había ninguno. */

test("cada edad de 5 a 17 cae en exactamente una banda", () => {
  for (let edad = 5; edad <= 17; edad++) {
    const contienen = BANDAS.filter(b => edad >= b.desde && edad <= b.hasta);
    assert.equal(
      contienen.length, 1,
      `la edad ${edad} cae en ${contienen.length} bandas (${contienen.map(b => b.id).join(", ") || "ninguna"})`
    );
  }
});

test("las bandas van ordenadas y encadenadas, sin saltos", () => {
  assert.equal(BANDAS[0].desde, 5, "la ruta empieza a los 5");
  assert.equal(BANDAS[BANDAS.length - 1].hasta, 17, "y termina a los 17");
  for (let i = 1; i < BANDAS.length; i++) {
    assert.equal(
      BANDAS[i].desde, BANDAS[i - 1].hasta + 1,
      `entre ${BANDAS[i - 1].id} y ${BANDAS[i].id} hay un salto o un solape`
    );
  }
});

test("el identificador dice las edades que cubre", () => {
  // El id se escribe en cada archivo de contenido a mano: si no se puede leer,
  // se etiqueta mal. "9-10" tiene que significar de 9 a 10 años.
  for (const banda of BANDAS) {
    assert.equal(banda.id, `${banda.desde}-${banda.hasta}`,
      `el id de la banda debería ser ${banda.desde}-${banda.hasta}`);
  }
});

test("previo existe, queda fuera de la ruta y no pisa ninguna banda", () => {
  // Matemáticas tiene contenido escrito para 1 a 5 años. No se tira: se marca
  // como previo, accesible pero fuera de la progresión.
  assert.ok(PREVIO, "hace falta una etiqueta para lo anterior a los 5 años");
  assert.equal(esBandaDeRuta(PREVIO.id), false, "previo no es un tramo de la ruta");
  assert.ok(BANDAS.every(b => b.id !== PREVIO.id), "previo no puede ser también una banda");
  assert.ok(PREVIO.hasta < BANDAS[0].desde, "previo termina antes de que empiece la ruta");
});

test("bandaDeEdad encuentra la banda de una edad, y previo por debajo de 5", () => {
  assert.equal(bandaDeEdad(5).id, BANDAS[0].id);
  assert.equal(bandaDeEdad(17).id, BANDAS[BANDAS.length - 1].id);
  assert.equal(bandaDeEdad(3).id, PREVIO.id);
  assert.equal(bandaDeEdad(30), null, "por encima de la ruta no hay banda");
});

test("bandaPorId conoce todas las bandas y ninguna inventada", () => {
  for (const banda of BANDAS) assert.equal(bandaPorId(banda.id), banda);
  assert.equal(bandaPorId(PREVIO.id), PREVIO);
  assert.equal(bandaPorId("nivel-6-8"), null, "los ids viejos ya no valen");
  assert.equal(bandaPorId("18-20"), null);
});

test("las seis bandas cubren la ruta y ninguna es de un solo año", () => {
  // Un tramo de un año se queda sin contenido suficiente y multiplica el trabajo
  // de etiquetado sin dar mejor progresión.
  assert.equal(BANDAS.length, 6);
  for (const banda of BANDAS) {
    assert.ok(banda.hasta > banda.desde, `${banda.id} cubre un solo año`);
  }
});
