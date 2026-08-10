import { test } from "node:test";
import assert from "node:assert/strict";
import { distanciaDe, zoomDe, TRAMOS, DISTANCIA_MINIMA } from "../universo/app/escenas/zoom.js";

/* La barra de zoom y la cámara tienen que decir lo mismo.

   `distanciaDe` la usa la barra; `zoomDe`, la rueda y el arrastre, para saber en
   qué punto de la barra ha quedado la cámara. Si no son inversas exactas, mover
   la cámara a mano deja la barra marcando otra cosa y el primer golpe de rueda
   salta de vuelta a lo que dice la barra. Ya pasó una vez. */

test("ir y volver deja el mismo punto de la barra", () => {
  for (let porcentaje = 0; porcentaje <= 100; porcentaje += 0.5) {
    const vuelta = zoomDe(distanciaDe(porcentaje));
    assert.ok(Math.abs(vuelta - porcentaje) < 1e-6,
      `${porcentaje}% → ${distanciaDe(porcentaje).toFixed(1)} → ${vuelta}%`);
  }
});

test("la barra recorre toda la escena, de punta a punta", () => {
  assert.equal(distanciaDe(0), DISTANCIA_MINIMA);
  assert.equal(distanciaDe(100), TRAMOS[TRAMOS.length - 1].hasta);
});

test("alejarse nunca acerca", () => {
  // Monótona creciente: sin esto la barra daría saltos hacia atrás.
  let anterior = 0;
  for (let porcentaje = 0; porcentaje <= 100; porcentaje += 0.5) {
    const distancia = distanciaDe(porcentaje);
    assert.ok(distancia > anterior, `a ${porcentaje}% la distancia no creció`);
    anterior = distancia;
  }
});

test("el desierto del medio se cruza en un tramo corto de barra", () => {
  /* Es el motivo de que la barra vaya por tramos. Entre las constelaciones y la
     galaxia no hay nada que mirar, así que ese trecho —el más largo de la
     escena— tiene que costar poco de recorrer. */
  const [cerca, salto] = TRAMOS;
  const barraDelSalto = salto.barra - cerca.barra;
  const caminoDelSalto = salto.hasta / cerca.hasta;

  assert.ok(barraDelSalto <= 0.10,
    `el salto se lleva ${(barraDelSalto * 100).toFixed(0)}% de la barra: demasiado para lo que no hay que ver`);
  assert.ok(caminoDelSalto > 8,
    "el salto debería cubrir mucha distancia; si no, no es un salto");
});

test("las constelaciones y el sistema solar se llevan la mayor parte de la barra", () => {
  // Es donde hay cosas que mirar y donde la gente va a pasar el rato.
  assert.ok(TRAMOS[0].barra >= 0.6,
    `el tramo cercano se lleva solo el ${(TRAMOS[0].barra * 100).toFixed(0)}% de la barra`);
});

test("una distancia fuera de rango no rompe la barra", () => {
  assert.equal(zoomDe(0), 0);
  assert.equal(zoomDe(-500), 0);
  assert.equal(zoomDe(1e9), 100);
  assert.equal(distanciaDe(-10), DISTANCIA_MINIMA);
  assert.equal(distanciaDe(500), TRAMOS[TRAMOS.length - 1].hasta);
});
