import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCatalog, entryBySlug, normalizeSearch } from "../universo/cielo/nav-model.js";

test("el catálogo tiene los cuatro grupos en orden", () => {
  const catalog = buildCatalog();
  assert.deepEqual(catalog.map(g => g.id), ["solar", "stars", "constellations", "galaxies"]);
});

test("el catálogo suma 415 entradas", () => {
  // Eran 207 cuando 183 se generaban con datos aproximados. Ahora las estrellas
  // salen de un catálogo real y se listan las 316 que tienen nombre propio.
  const total = buildCatalog().reduce((n, g) => n + g.entries.length, 0);
  assert.equal(total, 415);
});

test("el sistema solar lista 10 cuerpos con la Luna tras la Tierra", () => {
  const solar = buildCatalog().find(g => g.id === "solar");
  assert.deepEqual(solar.entries.map(e => e.slug), [
    "sun", "mercury", "venus", "earth", "moon", "mars",
    "jupiter", "saturn", "uranus", "neptune"
  ]);
});

test("las estrellas van de la más cercana a la más lejana", () => {
  const stars = buildCatalog().find(g => g.id === "stars");
  assert.equal(stars.entries.length, 316);
  assert.equal(stars.entries[0].slug, "proxima-centauri");
  assert.equal(stars.entries[1].slug, "rigil-kentaurus");
  assert.equal(stars.entries.at(-1).slug, "ton-618");
});

test("las constelaciones van en alfabético español", () => {
  const constellations = buildCatalog().find(g => g.id === "constellations");
  assert.equal(constellations.entries.length, 88);
  assert.equal(constellations.entries[0].name, "Acuario");
  assert.equal(constellations.entries.at(-1).name, "Zorra");
});

test("ninguna entrada tiene ya datos aproximados", () => {
  /* Este test decía lo contrario: comprobaba que 183 de 207 entradas estaban
     marcadas como aproximadas, porque 99 estrellas y 84 constelaciones se
     generaban con coordenadas heredadas y descripciones de plantilla. Al
     sustituirlas por catálogos reales, la marca dejó de tener a quién señalar.
     El mecanismo se conserva por si vuelve a entrar contenido aproximado. */
  const approximate = buildCatalog()
    .flatMap(g => g.entries)
    .filter(e => e.approximate);
  assert.equal(approximate.length, 0,
    `siguen marcadas como aproximadas: ${approximate.map(e => e.slug).join(", ")}`);
});

test("los cuerpos, la galaxia y las estrellas curadas no son aproximados", () => {
  assert.equal(entryBySlug("earth").approximate, false);
  assert.equal(entryBySlug("milky-way").approximate, false);
  assert.equal(entryBySlug("sirius").approximate, false);
  assert.equal(entryBySlug("orion").approximate, false);
});

test("las estrellas del catálogo traen datos medidos", () => {
  // Alpheratz era una de las inventadas: heredaba la coordenada de Andrómeda.
  const a = entryBySlug("alpheratz");
  assert.equal(a.approximate, false, "ya no es una aproximación");
  assert.match(a.detail, /años luz/, "su detalle debe incluir la distancia real");
  assert.equal(entryBySlug("aquarius").name, "Acuario");
  assert.equal(entryBySlug("aquarius").approximate, false);
});

test("el texto de búsqueda cubre nombre, tipo y constelación", () => {
  const betelgeuse = entryBySlug("betelgeuse");
  assert.match(betelgeuse.search, /betelgeuse/);
  assert.match(betelgeuse.search, /supergigante roja/);
  // `search` se guarda sin tildes (ver normalizeSearch): "orion", no "orión".
  assert.match(betelgeuse.search, /orion/, "filtrar por constelación debe encontrar sus estrellas");
  assert.equal(betelgeuse.search, betelgeuse.search.toLowerCase());
});

test("normalizeSearch quita tildes y pasa a minúsculas", () => {
  assert.equal(normalizeSearch("Orión"), "orion");
  assert.equal(normalizeSearch("ORIÓN"), "orion");
  assert.equal(normalizeSearch("orion"), "orion");
  assert.equal(normalizeSearch("Andrómeda"), "andromeda");
});

test("el campo search nunca lleva tildes, para que el filtro las ignore", () => {
  for (const entry of buildCatalog().flatMap(g => g.entries)) {
    assert.equal(
      entry.search, normalizeSearch(entry.search),
      `${entry.slug}: search debería estar ya normalizado`
    );
  }
});

test("buscar sin tildes encuentra entradas acentuadas: 'orion' encuentra Orión y Betelgeuse", () => {
  const needle = normalizeSearch("orion");
  const orion = entryBySlug("orion");
  const betelgeuse = entryBySlug("betelgeuse");
  assert.ok(orion.search.includes(needle), "Orión debe coincidir buscando 'orion' sin tilde");
  assert.ok(betelgeuse.search.includes(needle), "Betelgeuse debe coincidir por su constelación");
  // El nombre que ve el visitante conserva la tilde: solo se normaliza el texto de búsqueda.
  assert.equal(orion.name, "Orión");
  assert.equal(betelgeuse.name, "Betelgeuse");
});

test("buscar sin tildes con otra vocal acentuada: 'andromeda' encuentra Andrómeda", () => {
  const needle = normalizeSearch("andromeda");
  const andromeda = entryBySlug("andromeda");
  assert.ok(andromeda.search.includes(needle), "Andrómeda debe coincidir buscando 'andromeda' sin tilde");
  assert.equal(andromeda.name, "Andrómeda", "el nombre visible conserva la tilde");
});

test("buscar con la tilde puesta sigue funcionando igual que sin ella", () => {
  const conTilde = normalizeSearch("Orión");
  const sinTilde = normalizeSearch("orion");
  const enMayus = normalizeSearch("ORION");
  assert.equal(conTilde, sinTilde);
  assert.equal(conTilde, enMayus);
});

test("entryBySlug devuelve null para lo desconocido", () => {
  assert.equal(entryBySlug("no-existe"), null);
});

import { siblingsFor } from "../universo/cielo/nav-model.js";

test("la Tierra enlaza con Venus y Marte, no con la Luna", () => {
  const { prev, next } = siblingsFor("earth");
  assert.equal(prev.slug, "venus");
  assert.equal(next.slug, "mars");
});

test("los extremos del sistema solar tienen un solo vecino", () => {
  assert.equal(siblingsFor("sun").prev, null);
  assert.equal(siblingsFor("sun").next.slug, "mercury");
  assert.equal(siblingsFor("neptune").prev.slug, "uranus");
  assert.equal(siblingsFor("neptune").next, null);
});

test("la Luna no tiene hermanos: llega a la Tierra por el enlace de padre", () => {
  assert.deepEqual(siblingsFor("moon"), { prev: null, next: null });
});

test("las estrellas encadenan por distancia", () => {
  assert.equal(siblingsFor("proxima-centauri").prev, null);
  assert.equal(siblingsFor("proxima-centauri").next.slug, "rigil-kentaurus");
  assert.equal(siblingsFor("ton-618").next, null);
});

test("las constelaciones no usan hermanos: tienen su lista interna", () => {
  assert.deepEqual(siblingsFor("orion"), { prev: null, next: null });
});

test("la galaxia única no tiene hermanos", () => {
  assert.deepEqual(siblingsFor("milky-way"), { prev: null, next: null });
});

test("un slug desconocido no rompe", () => {
  assert.deepEqual(siblingsFor("no-existe"), { prev: null, next: null });
});
