import { test } from "node:test";
import assert from "node:assert/strict";
import { BANDAS, bandaPorId, bandaDeEdad, esBandaDeRuta, bandaAnteriorA, bandaSiguienteA } from "../contenido/bandas.js";

/* Las bandas son la columna vertebral de la ruta de aprendizaje: cada página y
   cada pregunta lleva una. Si no particionan las edades, la ruta tiene huecos o
   contenido duplicado, y eso no se ve mirando el sitio: se ve cuando un padre
   busca qué toca a los 6 años y no hay nada.

   Las bandas viejas de matemáticas eran 1-3, 3-5, 6-8, 9-11, 12-14 y 15-17: los
   3 años caían en dos tramos y entre los 5 y los 6 no había ninguno. */

test("cada edad de 4 a 17 cae en exactamente una banda", () => {
  for (let edad = 4; edad <= 17; edad++) {
    const contienen = BANDAS.filter(b => edad >= b.desde && edad <= b.hasta);
    assert.equal(
      contienen.length, 1,
      `la edad ${edad} cae en ${contienen.length} bandas (${contienen.map(b => b.id).join(", ") || "ninguna"})`
    );
  }
});

test("las bandas van ordenadas y encadenadas, sin saltos", () => {
  assert.equal(BANDAS[0].desde, 4, "la ruta empieza a los 4");
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
  // se etiqueta mal. "10-11" tiene que significar de 9 a 10 años.
  for (const banda of BANDAS) {
    assert.equal(banda.id, `${banda.desde}-${banda.hasta}`,
      `el id de la banda debería ser ${banda.desde}-${banda.hasta}`);
  }
});

test("el primer tramo es el de acompañar con un adulto, y lo dice", () => {
  /* A los 4 y 5 años quien usa Explora no es el niño: es el adulto que le enseña. La
     interfaz tiene que poder tratarlo distinto sin adivinarlo por el identificador,
     que es lo que pasaría si esto fuera solo un comentario. */
  assert.equal(BANDAS[0].id, "4-5");
  assert.equal(BANDAS[0].paraAdultos, true, "el primer tramo tiene que declararse para adultos");
  const resto = BANDAS.slice(1);
  assert.ok(resto.every(banda => !banda.paraAdultos),
    "solo el primer tramo va dirigido al adulto");
});

test("todas las bandas son de la ruta", () => {
  // Ya no hay etiquetas con contenido fuera de la progresión, que era «previo».
  for (const banda of BANDAS) assert.equal(esBandaDeRuta(banda.id), true, banda.id);
  assert.equal(esBandaDeRuta("previo"), false, "«previo» ya no existe");
  assert.equal(esBandaDeRuta("15-17"), false, "las bandas viejas ya no existen");
});

test("bandaDeEdad encuentra la banda de una edad, y nada fuera de rango", () => {
  assert.equal(bandaDeEdad(4).id, BANDAS[0].id);
  assert.equal(bandaDeEdad(17).id, BANDAS[BANDAS.length - 1].id);
  assert.equal(bandaDeEdad(15).id, "14-15", "los 15 son segundo medio");
  /* Por debajo de 4 no se devuelve la primera banda como si sirviera: Explora no
     cubre esas edades y decirlo es más útil que fingir que sí. */
  assert.equal(bandaDeEdad(3), null, "por debajo de la ruta no hay banda");
  assert.equal(bandaDeEdad(30), null, "por encima de la ruta no hay banda");
});

test("se puede recorrer la progresión hacia atrás y hacia adelante", () => {
  /* Es lo que sostiene el «vuelve un tramo a reforzar» y el «puedes seguir». En los
     extremos devuelve null, que es lo que permite no pintar un enlace a ninguna
     parte. */
  assert.equal(bandaAnteriorA("4-5"), null, "antes del primero no hay nada");
  assert.equal(bandaSiguienteA("16-17"), null, "después del último tampoco");
  assert.equal(bandaAnteriorA("10-11").id, "8-9");
  assert.equal(bandaSiguienteA("10-11").id, "12-13");
  assert.equal(bandaAnteriorA("inventada"), null);

  // Y encadenan: recorrerlas hacia adelante desde la primera da la lista entera.
  const recorrido = [BANDAS[0].id];
  let actual = BANDAS[0].id;
  while (bandaSiguienteA(actual)) { actual = bandaSiguienteA(actual).id; recorrido.push(actual); }
  assert.deepEqual(recorrido, BANDAS.map(b => b.id));
});

test("bandaPorId conoce todas las bandas y ninguna inventada", () => {
  for (const banda of BANDAS) assert.equal(bandaPorId(banda.id), banda);
  assert.equal(bandaPorId("nivel-6-8"), null, "los ids viejos ya no valen");
  assert.equal(bandaPorId("previo"), null, "«previo» dejó de existir");
  assert.equal(bandaPorId("18-20"), null);
});

test("las siete bandas cubren la ruta y ninguna es de un solo año", () => {
  // Un tramo de un año se queda sin contenido suficiente y multiplica el trabajo
  // de etiquetado sin dar mejor progresión.
  assert.equal(BANDAS.length, 7);
  for (const banda of BANDAS) {
    assert.ok(banda.hasta > banda.desde, `${banda.id} cubre un solo año`);
  }
});
