import { test } from "node:test";
import assert from "node:assert/strict";
import {
  simplificar, esIrreducible, decimalDe, decimalEscrito, comoMixto
} from "../materias/app/actividades/racionales-cuenta.js";

/* Lo que esta actividad enseña es que hay dos clases de decimal —el que termina y
   el que se repite para siempre—, así que la distinción tiene que estar bien. Con
   la división de JavaScript no se puede ni ver: 1/3 da 0.3333333333333333, dieciséis
   treses y una mentira. Aquí se hace por división larga, como en clase. */

test("un decimal exacto se reconoce y se escribe entero", () => {
  assert.deepEqual(decimalDe(3, 4), { negativo: false, entera: 0, fijas: "75", periodo: "", exacto: true });
  assert.equal(decimalEscrito(3, 4), "0,75");
  assert.equal(decimalEscrito(5, 8), "0,625");
  assert.equal(decimalEscrito(1, 2), "0,5");
});

test("un decimal periódico se reconoce y se marca su periodo", () => {
  assert.deepEqual(decimalDe(1, 3), { negativo: false, entera: 0, fijas: "", periodo: "3", exacto: false });
  assert.equal(decimalEscrito(1, 3), "0,(3)");
  // 2/7 tiene periodo de seis cifras, que es el caso bonito de esta página.
  assert.equal(decimalEscrito(2, 7), "0,(285714)");
});

test("el periodo puede empezar después de unas cifras fijas", () => {
  /* 5/6 = 0,8333… El 8 no se repite y el 3 sí. Es el caso que un algoritmo ingenuo
     —«¿el denominador solo tiene factores 2 y 5?»— resuelve, pero que uno que mire
     solo la primera cifra decimal se come. */
  assert.deepEqual(decimalDe(5, 6), { negativo: false, entera: 0, fijas: "8", periodo: "3", exacto: false });
  assert.equal(decimalEscrito(5, 6), "0,8(3)");
  assert.equal(decimalEscrito(1, 6), "0,1(6)");
});

test("nunca sale un decimal infinito sin repetirse", () => {
  /* Es el borde de los racionales, y la razón de que π no sea uno. Si algún par
     diera cifras infinitas sin periodo, la página estaría enseñando algo falso. */
  for (let b = 1; b <= 40; b++) {
    for (let a = 0; a <= 40; a++) {
      const d = decimalDe(a, b);
      assert.ok(d.exacto || d.periodo.length > 0, `${a}/${b} no termina ni se repite`);
      // El periodo de a/b nunca puede tener más de b−1 cifras: solo hay b−1 restos
      // distintos posibles antes de repetir uno.
      assert.ok(d.periodo.length <= b - 1 || d.exacto, `${a}/${b} tiene un periodo imposible`);
    }
  }
});

test("los enteros salen sin coma", () => {
  assert.equal(decimalEscrito(4, 2), "2");
  assert.equal(decimalEscrito(0, 7), "0");
  assert.equal(decimalEscrito(9, 3), "3");
});

test("una fracción mayor que uno tiene parte entera", () => {
  assert.equal(decimalEscrito(7, 4), "1,75");
  assert.equal(decimalEscrito(10, 3), "3,(3)");
});

test("el signo va delante y no dentro", () => {
  assert.equal(decimalEscrito(-3, 4), "−0,75");
  assert.equal(decimalEscrito(3, -4), "−0,75");
  // Menos por menos: positivo.
  assert.equal(decimalEscrito(-3, -4), "0,75");
  assert.equal(decimalEscrito(0, -5), "0", "el cero no lleva signo");
});

test("simplificar deja la fracción irreducible y el signo arriba", () => {
  assert.deepEqual(simplificar(18, 24), { numerador: 3, denominador: 4 });
  assert.deepEqual(simplificar(50, 100), { numerador: 1, denominador: 2 });
  // −3/4 y no 3/−4: es como se escribe.
  assert.deepEqual(simplificar(3, -4), { numerador: -3, denominador: 4 });
  assert.deepEqual(simplificar(0, 5), { numerador: 0, denominador: 1 });
});

test("dividir por cero no devuelve nada, en vez de inventarse un número", () => {
  /* Si 6/0 valiera algún número n, entonces n × 0 tendría que ser 6, y cualquier
     número por cero da cero. No hay respuesta, y decir «Infinity» sería enseñar lo
     contrario de lo que dice la página. */
  assert.equal(decimalDe(6, 0), null);
  assert.equal(decimalEscrito(6, 0), null);
  assert.equal(simplificar(6, 0), null);
  assert.equal(comoMixto(6, 0), null);
});

test("una fracción equivalente da el mismo decimal", () => {
  // Es la definición de equivalente, y conviene que la actividad no la contradiga.
  for (const [a, b] of [[1, 2], [2, 4], [3, 6], [50, 100]]) {
    assert.equal(decimalEscrito(a, b), "0,5", `${a}/${b}`);
  }
});

test("el número mixto solo aparece cuando hay entero que sacar", () => {
  assert.deepEqual(comoMixto(7, 4), { entera: 1, numerador: 3, denominador: 4 });
  assert.deepEqual(comoMixto(10, 3), { entera: 3, numerador: 1, denominador: 3 });
  // «0 enteros y 3/4» no aclara nada.
  assert.equal(comoMixto(3, 4), null);
});

test("se sabe cuándo una fracción ya está en su forma más simple", () => {
  assert.equal(esIrreducible(3, 4), true);
  assert.equal(esIrreducible(18, 24), false);
  assert.equal(esIrreducible(7, 9), true);
});
