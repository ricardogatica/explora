import { test } from "node:test";
import assert from "node:assert/strict";
import { consejoDeTanda, MAL, BIEN } from "../materias/app/consejo.js";

/* Qué se le dice a alguien al terminar. Se prueba porque las dos formas de
   equivocarse aquí son caras: mandar hacia atrás a quien va bien, y dejar atascado
   a quien no avanza. */

const VECINDAD = {
  anterior: { titulo: "7 a 8 años", ruta: "/matematicas/edad/7-8/" },
  siguiente: { titulo: "11 a 12 años", ruta: "/matematicas/edad/11-12/" }
};

test("por debajo de la mitad se propone volver atrás", () => {
  assert.equal(consejoDeTanda(0, 10, VECINDAD).tipo, "atras");
  assert.equal(consejoDeTanda(4, 10, VECINDAD).tipo, "atras");
  assert.equal(consejoDeTanda(49, 100, VECINDAD).tipo, "atras");
});

test("justo en la mitad no se dice nada", () => {
  /* El borde importa: con 5 de 10 no hay nada seguro que decir, y un consejo dudoso
     se paga caro —si se propone retroceder a quien va bien, la próxima vez no se
     hace caso del consejo aunque acierte—. */
  assert.equal(consejoDeTanda(5, 10, VECINDAD), null);
  assert.equal(consejoDeTanda(MAL * 100, 100, VECINDAD), null);
});

test("entre la mitad y el 85 tampoco", () => {
  for (const puntos of [51, 60, 70, 80, 84]) {
    assert.equal(consejoDeTanda(puntos, 100, VECINDAD), null, `con ${puntos} de 100`);
  }
});

test("con 85 o más se propone seguir", () => {
  assert.equal(consejoDeTanda(85, 100, VECINDAD).tipo, "adelante");
  assert.equal(consejoDeTanda(BIEN * 100, 100, VECINDAD).tipo, "adelante");
  assert.equal(consejoDeTanda(10, 10, VECINDAD).tipo, "adelante");
});

test("el umbral de avanzar es alto a propósito", () => {
  /* Decirle a alguien que siga cuando aún falla una de cada cuatro es empujarlo a un
     sitio donde se va a atascar. */
  assert.ok(BIEN >= 0.8, `el umbral de avanzar es ${BIEN}: demasiado permisivo`);
  assert.equal(consejoDeTanda(75, 100, VECINDAD), null, "con tres de cada cuatro no se avanza");
});

test("en el primer tramo no se manda hacia atrás", () => {
  // No hay nada antes: proponer volver sería mandar a ninguna parte.
  const primero = { anterior: null, siguiente: VECINDAD.siguiente };
  assert.equal(consejoDeTanda(0, 10, primero), null);
});

test("en el último tramo no se manda hacia adelante", () => {
  const ultimo = { anterior: VECINDAD.anterior, siguiente: null };
  assert.equal(consejoDeTanda(10, 10, ultimo), null);
  // Pero sí hacia atrás, que ahí sigue habiendo sitio.
  assert.equal(consejoDeTanda(1, 10, ultimo).tipo, "atras");
});

test("sin tramo o sin puntos posibles no se inventa nada", () => {
  /* Una tanda de solo observaciones puede sumar cero de máximo; dividir por cero
     daría NaN y NaN < 0.5 es falso, así que no rompería, pero tampoco diría nada
     con sentido. Se corta antes. */
  assert.equal(consejoDeTanda(0, 0, VECINDAD), null);
  assert.equal(consejoDeTanda(5, 10, null), null);
  assert.equal(consejoDeTanda(5, 10, undefined), null);
});
