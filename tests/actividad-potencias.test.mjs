import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calcular, expansion, intercambiada, comoSeEscribe, escalones, enSuperindice,
  EXPONENTE_MINIMO, EXPONENTE_MAXIMO
} from "../materias/app/actividades/potencias-cuenta.js";

/* La actividad de potencias enseña una cuenta, así que la cuenta tiene que estar
   bien. Dos de estas pruebas existen por fallos que aparecieron moviendo los mandos
   en el navegador, no leyendo el código: el «1/1» con base 1 y una comparación que
   afirmaba algo falso. */

test("una potencia normal se calcula y se escribe agrupada", () => {
  assert.deepEqual(calcular(2, 5), { valor: 32, escrito: "32" });
  assert.deepEqual(calcular(10, 8), { valor: 100000000, escrito: "100.000.000" });
});

test("el exponente cero da uno, para cualquier base", () => {
  for (const base of [1, 2, 3, 7, 10]) {
    assert.equal(calcular(base, 0).valor, 1, `${base}⁰ debería ser 1`);
  }
});

test("el exponente negativo da una fracción, no un decimal", () => {
  /* 1/8 dice lo que pasa; 0,125 lo esconde, y a esta edad esconderlo es perder la
     única pista de que un exponente negativo no da un número negativo. */
  assert.deepEqual(calcular(2, -3), { valor: 0.125, escrito: "1/8" });
  assert.equal(calcular(3, -3).escrito, "1/27");
});

test("con base 1 el exponente negativo no escribe «1/1»", () => {
  // Salió moviendo los mandos: es correcto y se lee mal.
  assert.equal(calcular(1, -3).escrito, "1");
  assert.equal(calcular(1, -1).escrito, "1");
});

test("la expansión muestra la multiplicación entera", () => {
  assert.equal(expansion(3, 4), "3 · 3 · 3 · 3");
  assert.equal(expansion(2, 1), "2");
  assert.equal(expansion(5, -2), "1 ÷ (5 · 5)");
});

test("el exponente cero explica su uno en vez de dejarlo solo", () => {
  /* Un «1» sin más es justo lo que hace que a⁰ = 1 parezca una regla arbitraria. */
  assert.match(expansion(4, 0), /ningún factor/);
});

test("los superíndices incluyen el signo del exponente", () => {
  assert.equal(enSuperindice(5), "⁵");
  assert.equal(enSuperindice(0), "⁰");
  assert.equal(enSuperindice(-3), "⁻³");
  assert.equal(enSuperindice(10), "¹⁰");
  assert.equal(comoSeEscribe(2, -3), "2⁻³");
});

test("intercambiar no siempre gana la potencia con el exponente mayor", () => {
  /* Este es el fallo que motivó la prueba. El aviso decía «el exponente pesa mucho
     más que la base», que es cierto con 2 y 5 y falso con 10 y 8. Una moral general
     sacada de un ejemplo es peor que no decir nada. */
  const dosCinco = { propia: calcular(2, 5), otra: intercambiada(2, 5) };
  assert.ok(dosCinco.propia.valor > dosCinco.otra.valor, "2⁵ = 32 debería ganar a 5² = 25");

  const diezOcho = { propia: calcular(10, 8), otra: intercambiada(10, 8) };
  assert.ok(diezOcho.otra.valor > diezOcho.propia.valor,
    "8¹⁰ = 1.073.741.824 debería ganar a 10⁸ = 100.000.000");
});

test("no se ofrece intercambio cuando no hay nada que comparar", () => {
  assert.equal(intercambiada(3, 3), null, "3³ intercambiado es la misma potencia");
  assert.equal(intercambiada(2, 0), null, "con exponente cero el intercambio no dice nada");
  assert.equal(intercambiada(2, -3), null, "con exponente negativo tampoco");
});

test("la escalera muestra el escalón anterior, el actual y el siguiente", () => {
  const pasos = escalones(3, 4);
  assert.deepEqual(pasos.map(p => p.n), [3, 4, 5]);
  assert.deepEqual(pasos.map(p => p.escrito), ["27", "81", "243"]);
});

test("cada escalón multiplica por la base exactamente", () => {
  /* Es toda la idea de la escalera: si esto no se cumple, no enseña nada. */
  for (const base of [2, 3, 5, 10]) {
    const pasos = escalones(base, 4);
    for (let i = 1; i < pasos.length; i++) {
      assert.equal(pasos[i].valor, pasos[i - 1].valor * base,
        `con base ${base}, el escalón ${pasos[i].n} no es el anterior por ${base}`);
    }
  }
});

test("la escalera no se sale de los límites de los mandos", () => {
  // En los extremos hay dos escalones en vez de tres, y eso es correcto.
  assert.deepEqual(escalones(2, EXPONENTE_MINIMO).map(p => p.n), [EXPONENTE_MINIMO, EXPONENTE_MINIMO + 1]);
  assert.deepEqual(escalones(2, EXPONENTE_MAXIMO).map(p => p.n), [EXPONENTE_MAXIMO - 1, EXPONENTE_MAXIMO]);
});

test("la escalera cruza el cero sin ningún caso especial", () => {
  /* Que el cero sea un escalón como los demás es lo que hace que a⁰ = 1 se
     entienda en vez de memorizarse. */
  const pasos = escalones(3, 0);
  assert.deepEqual(pasos.map(p => p.n), [-1, 0, 1]);
  assert.deepEqual(pasos.map(p => p.escrito), ["1/3", "1", "3"]);
});
