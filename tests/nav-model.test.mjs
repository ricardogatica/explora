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

import { siblingsFor, resolveContext, breadcrumbFor } from "../sistema_solar/nav-model.js";

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

test("el contexto sale del data-slug de los cuerpos", () => {
  const context = resolveContext({
    dataset: { slug: "earth" }, search: "", filename: "earth.html"
  });
  assert.equal(context.kind, "body");
  assert.equal(context.slug, "earth");
  assert.equal(context.name, "Tierra");
});

test("el contexto sale del data-universe-slug de las estrellas con ficha", () => {
  const context = resolveContext({
    dataset: { universeSlug: "sirius" }, search: "", filename: "sirius.html"
  });
  assert.equal(context.kind, "universe");
  assert.equal(context.slug, "sirius");
  assert.equal(context.name, "Sirio");
});

test("el contexto sale de ?slug= en la plantilla de estrellas", () => {
  const context = resolveContext({
    dataset: {}, search: "?slug=alpheratz", filename: "star.html"
  });
  assert.equal(context.kind, "universe");
  assert.equal(context.slug, "alpheratz");
  assert.equal(context.name, "Alpheratz");
});

test("constellations.html con ?slug= se reconoce como constelación", () => {
  const context = resolveContext({
    dataset: {}, search: "?slug=orion", filename: "constellations.html"
  });
  assert.equal(context.kind, "constellation");
  assert.equal(context.slug, "orion");
  assert.equal(context.name, "Orión");
});

test("las páginas sin ficha se reconocen por nombre de archivo", () => {
  const context = resolveContext({ dataset: {}, search: "", filename: "referencias.html" });
  assert.equal(context.kind, "page");
  assert.equal(context.slug, null);
  assert.equal(context.name, "Referencias");
});

test("la miga de una ficha llega hasta la portada", () => {
  const crumbs = breadcrumbFor(
    resolveContext({ dataset: { slug: "earth" }, search: "", filename: "earth.html" })
  );
  assert.deepEqual(crumbs, [
    { label: "Explora", href: "../index.html" },
    { label: "Universo", href: "./index.html" },
    { label: "Índice", href: "./indice.html" },
    { label: "Tierra", href: null }
  ]);
});

test("la miga del índice no se enlaza a sí misma", () => {
  const crumbs = breadcrumbFor(
    resolveContext({ dataset: {}, search: "", filename: "indice.html" })
  );
  assert.deepEqual(crumbs, [
    { label: "Explora", href: "../index.html" },
    { label: "Universo", href: "./index.html" },
    { label: "Índice", href: null }
  ]);
});

test("la miga de la escena 3D no se enlaza a sí misma", () => {
  const crumbs = breadcrumbFor(
    resolveContext({ dataset: {}, search: "", filename: "index.html" })
  );
  assert.deepEqual(crumbs, [
    { label: "Explora", href: "../index.html" },
    { label: "Universo", href: null }
  ]);
});

test("toda página tiene la portada a un clic", () => {
  const filenames = [
    "index.html", "indice.html", "earth.html", "sirius.html",
    "star.html", "constellations.html", "solar-scale.html", "referencias.html"
  ];
  for (const filename of filenames) {
    const crumbs = breadcrumbFor(resolveContext({ dataset: {}, search: "", filename }));
    assert.equal(crumbs[0].href, "../index.html", `${filename} no llega a la portada`);
  }
});
