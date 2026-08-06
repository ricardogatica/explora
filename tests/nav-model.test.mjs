import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCatalog, entryBySlug } from "../sistema_solar/nav-model.js";

test("el catálogo tiene los cuatro grupos en orden", () => {
  const catalog = buildCatalog();
  assert.deepEqual(catalog.map(g => g.id), ["solar", "stars", "constellations", "galaxies"]);
});

test("el catálogo suma 207 entradas", () => {
  const total = buildCatalog().reduce((n, g) => n + g.entries.length, 0);
  assert.equal(total, 207);
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
  assert.equal(stars.entries.length, 108);
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

test("cada entrada apunta a su destino real", () => {
  assert.equal(entryBySlug("earth").href, "earth.html");
  assert.equal(entryBySlug("sirius").href, "sirius.html");
  assert.equal(entryBySlug("alpheratz").href, "star.html?slug=alpheratz");
  assert.equal(entryBySlug("orion").href, "constellations.html?slug=orion");
  assert.equal(entryBySlug("milky-way").href, "milky-way.html");
});

test("183 entradas están marcadas como aproximadas", () => {
  const approximate = buildCatalog()
    .flatMap(g => g.entries)
    .filter(e => e.approximate);
  assert.equal(approximate.length, 183);
});

test("los cuerpos, la galaxia y las estrellas curadas no son aproximados", () => {
  assert.equal(entryBySlug("earth").approximate, false);
  assert.equal(entryBySlug("milky-way").approximate, false);
  assert.equal(entryBySlug("sirius").approximate, false);
  assert.equal(entryBySlug("orion").approximate, false);
});

test("lo generado sí está marcado como aproximado", () => {
  assert.equal(entryBySlug("alpheratz").approximate, true);
  assert.equal(entryBySlug("aquarius").approximate, true);
  assert.equal(entryBySlug("aquarius").name, "Acuario");
});

test("el texto de búsqueda cubre nombre, tipo y constelación", () => {
  const betelgeuse = entryBySlug("betelgeuse");
  assert.match(betelgeuse.search, /betelgeuse/);
  assert.match(betelgeuse.search, /supergigante roja/);
  assert.match(betelgeuse.search, /orión/, "filtrar por constelación debe encontrar sus estrellas");
  assert.equal(betelgeuse.search, betelgeuse.search.toLowerCase());
});

test("entryBySlug devuelve null para lo desconocido", () => {
  assert.equal(entryBySlug("no-existe"), null);
});
