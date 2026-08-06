import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCatalog, entryBySlug, entryForPage, normalizeSearch } from "../sistema_solar/nav-model.js";

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

test("constellations.html no resuelve un slug estelar ni le da hermanos", () => {
  // El mapa de slugs es plano sobre los 4 grupos; sin filtro por página,
  // ?slug=sirius pintaba «… › Sirio» y los botones ‹ Rigil Kentaurus / Procyon ›
  // sobre el mapa celeste, que según el spec no lleva salto entre hermanos.
  const context = resolveContext({
    dataset: {}, search: "?slug=sirius", filename: "constellations.html"
  });
  assert.equal(context.kind, "page", "una estrella no es una ficha de constellations.html");
  assert.equal(context.slug, null, "el slug ajeno no debe adoptarse");
  assert.equal(context.name, "Constelaciones", "la página sigue siendo el mapa celeste");
  assert.deepEqual(
    siblingsFor("sirius", { filename: "constellations.html" }), { prev: null, next: null },
    "constellations.html no lleva salto entre hermanos"
  );
});

test("star.html solo resuelve estrellas y galaxias, no constelaciones", () => {
  const context = resolveContext({
    dataset: {}, search: "?slug=orion", filename: "star.html"
  });
  assert.equal(context.kind, "page", "una constelación no es una ficha de star.html");
  assert.equal(context.slug, null);
  assert.deepEqual(siblingsFor("orion", { filename: "star.html" }), { prev: null, next: null });
});

test("cada página sigue resolviendo los slugs que sí son suyos", () => {
  assert.equal(entryForPage("orion", "constellations.html")?.slug, "orion");
  assert.equal(entryForPage("alpheratz", "star.html")?.slug, "alpheratz");
  assert.equal(entryForPage("milky-way", "star.html")?.slug, "milky-way");
  // Una página sin grupos declarados no restringe: su slug va en el dataset.
  assert.equal(entryForPage("earth", "earth.html")?.slug, "earth");
  assert.equal(entryForPage("sirius", "sirius.html")?.slug, "sirius");
  // Y los hermanos siguen saliendo donde sí corresponden.
  assert.equal(siblingsFor("earth", { filename: "earth.html" }).next?.slug, "mars");
  assert.equal(siblingsFor("alpheratz", { filename: "star.html" }).next !== undefined, true);
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

test("star.html sin slug no se hace pasar por la portada", () => {
  const crumbs = breadcrumbFor(
    resolveContext({ dataset: {}, search: "", filename: "star.html" })
  );
  assert.equal(crumbs.length, 3, "star.html sin slug termina en Índice sin inventar etiqueta");
  assert.equal(crumbs[2].label, "Índice", "debe incluir Índice como elemento final");
  assert.equal(crumbs[2].href, "./indice.html", "Índice debe estar enlazado para ruta de escape");
});

test("slug irresoluble no se hace pasar por la portada", () => {
  const crumbs = breadcrumbFor(
    resolveContext({ dataset: { slug: "no-existe" }, search: "", filename: "earth.html" })
  );
  assert.equal(crumbs.length, 3, "slug irresoluble termina en Índice sin inventar etiqueta");
  assert.equal(crumbs[2].label, "Índice", "debe incluir Índice como elemento final");
  assert.equal(crumbs[2].href, "./indice.html", "Índice debe estar enlazado para ruta de escape");
});

test("página futura desconocida no se hace pasar por la portada", () => {
  const crumbs = breadcrumbFor(
    resolveContext({ dataset: {}, search: "", filename: "pagina-que-no-existe.html" })
  );
  assert.equal(crumbs.length, 3, "página desconocida termina en Índice sin inventar etiqueta");
  assert.equal(crumbs[2].label, "Índice", "debe incluir Índice como elemento final");
  assert.equal(crumbs[2].href, "./indice.html", "Índice debe estar enlazado para ruta de escape");
});

test("index.html exactamente 2 elementos en la miga", () => {
  const crumbs = breadcrumbFor(
    resolveContext({ dataset: {}, search: "", filename: "index.html" })
  );
  assert.equal(crumbs.length, 2, "index.html debe tener miga colapsada");
  assert.equal(crumbs[0].label, "Explora", "primer elemento es Explora");
  assert.equal(crumbs[1].label, "Universo", "segundo elemento es Universo sin enlace");
  assert.equal(crumbs[1].href, null, "Universo no debe estar enlazado en portada");
});

test("indice.html exactamente 3 elementos en la miga", () => {
  const crumbs = breadcrumbFor(
    resolveContext({ dataset: {}, search: "", filename: "indice.html" })
  );
  assert.equal(crumbs.length, 3, "indice.html debe tener 3 elementos");
  assert.equal(crumbs[0].label, "Explora", "primer elemento es Explora");
  assert.equal(crumbs[1].label, "Universo", "segundo elemento es Universo");
  assert.equal(crumbs[2].label, "Índice", "tercer elemento es Índice sin enlace");
  assert.equal(crumbs[2].href, null, "Índice no debe estar enlazado desde sí mismo");
});

test("última miga de star.html sin slug es Índice sin inventar", () => {
  const crumbs = breadcrumbFor(
    resolveContext({ dataset: {}, search: "", filename: "star.html" })
  );
  assert.equal(crumbs.at(-1).label, "Índice", "última etiqueta debe ser Índice, no Universo");
  assert.equal(crumbs.at(-1).href, "./indice.html", "Índice debe estar enlazado como ruta de escape");
});

test("última miga de slug irresoluble es Índice sin inventar", () => {
  const crumbs = breadcrumbFor(
    resolveContext({ dataset: { slug: "no-existe" }, search: "", filename: "earth.html" })
  );
  assert.equal(crumbs.at(-1).label, "Índice", "última etiqueta debe ser Índice, no Universo");
  assert.equal(crumbs.at(-1).href, "./indice.html", "Índice debe estar enlazado como ruta de escape");
});

test("última miga de página inventada es Índice sin inventar", () => {
  const crumbs = breadcrumbFor(
    resolveContext({ dataset: {}, search: "", filename: "pagina-inventada.html" })
  );
  assert.equal(crumbs.at(-1).label, "Índice", "última etiqueta debe ser Índice, no pagina-inventada");
  assert.equal(crumbs.at(-1).href, "./indice.html", "Índice debe estar enlazado como ruta de escape");
});

test("ninguna miga tiene etiquetas duplicadas", () => {
  const testCases = [
    { dataset: {}, search: "", filename: "index.html" },
    { dataset: {}, search: "", filename: "indice.html" },
    { dataset: { slug: "earth" }, search: "", filename: "earth.html" },
    { dataset: {}, search: "", filename: "star.html" },
    { dataset: { slug: "no-existe" }, search: "", filename: "earth.html" },
    { dataset: {}, search: "", filename: "pagina-inventada.html" }
  ];
  for (const testCase of testCases) {
    const crumbs = breadcrumbFor(resolveContext(testCase));
    const labels = crumbs.map(c => c.label);
    const uniqueLabels = new Set(labels);
    assert.equal(
      labels.length, uniqueLabels.size,
      `${testCase.filename || "unknown"} tiene etiquetas duplicadas: ${labels.join(", ")}`
    );
  }
});

test("ficha válida sigue teniendo 4 elementos con nombre correcto", () => {
  const crumbs = breadcrumbFor(
    resolveContext({ dataset: { slug: "earth" }, search: "", filename: "earth.html" })
  );
  assert.equal(crumbs.length, 4, "ficha válida debe tener 4 elementos");
  assert.equal(crumbs[3].label, "Tierra", "último elemento es el nombre de la ficha");
  assert.equal(crumbs[3].href, null, "no debe estar enlazado");
});

test("tabla completa de migas: etiquetas y enlaces exactos", () => {
  // Tabla del coordinador: cada fila define un caso de prueba.
  // { filename, dataset, search, expected: [{ label, href }, ...] }
  const table = [
    {
      name: "index.html",
      filename: "index.html", dataset: {}, search: "",
      expected: [
        { label: "Explora", href: "../index.html" },
        { label: "Universo", href: null }
      ]
    },
    {
      name: "indice.html",
      filename: "indice.html", dataset: {}, search: "",
      expected: [
        { label: "Explora", href: "../index.html" },
        { label: "Universo", href: "./index.html" },
        { label: "Índice", href: null }
      ]
    },
    {
      name: "earth.html con slug",
      filename: "earth.html", dataset: { slug: "earth" }, search: "",
      expected: [
        { label: "Explora", href: "../index.html" },
        { label: "Universo", href: "./index.html" },
        { label: "Índice", href: "./indice.html" },
        { label: "Tierra", href: null }
      ]
    },
    {
      name: "sirius.html con universeSlug",
      filename: "sirius.html", dataset: { universeSlug: "sirius" }, search: "",
      expected: [
        { label: "Explora", href: "../index.html" },
        { label: "Universo", href: "./index.html" },
        { label: "Índice", href: "./indice.html" },
        { label: "Sirio", href: null }
      ]
    },
    {
      name: "constellations.html con ?slug=orion",
      filename: "constellations.html", dataset: {}, search: "?slug=orion",
      expected: [
        { label: "Explora", href: "../index.html" },
        { label: "Universo", href: "./index.html" },
        { label: "Índice", href: "./indice.html" },
        { label: "Orión", href: null }
      ]
    },
    {
      name: "solar-scale.html (página conocida)",
      filename: "solar-scale.html", dataset: {}, search: "",
      expected: [
        { label: "Explora", href: "../index.html" },
        { label: "Universo", href: "./index.html" },
        { label: "Índice", href: "./indice.html" },
        { label: "Escala planetaria", href: null }
      ]
    },
    {
      name: "constellations.html (página conocida)",
      filename: "constellations.html", dataset: {}, search: "",
      expected: [
        { label: "Explora", href: "../index.html" },
        { label: "Universo", href: "./index.html" },
        { label: "Índice", href: "./indice.html" },
        { label: "Constelaciones", href: null }
      ]
    },
    {
      name: "referencias.html (página conocida)",
      filename: "referencias.html", dataset: {}, search: "",
      expected: [
        { label: "Explora", href: "../index.html" },
        { label: "Universo", href: "./index.html" },
        { label: "Índice", href: "./indice.html" },
        { label: "Referencias", href: null }
      ]
    },
    {
      name: "pagina-inventada.html (desconocida)",
      filename: "pagina-inventada.html", dataset: {}, search: "",
      expected: [
        { label: "Explora", href: "../index.html" },
        { label: "Universo", href: "./index.html" },
        { label: "Índice", href: "./indice.html" }
      ]
    },
    {
      name: "star.html sin slug (desconocida)",
      filename: "star.html", dataset: {}, search: "",
      expected: [
        { label: "Explora", href: "../index.html" },
        { label: "Universo", href: "./index.html" },
        { label: "Índice", href: "./indice.html" }
      ]
    },
    {
      name: "earth.html con slug irresoluble (desconocida)",
      filename: "earth.html", dataset: { slug: "no-existe" }, search: "",
      expected: [
        { label: "Explora", href: "../index.html" },
        { label: "Universo", href: "./index.html" },
        { label: "Índice", href: "./indice.html" }
      ]
    }
  ];

  for (const { name, filename, dataset, search, expected } of table) {
    const crumbs = breadcrumbFor(resolveContext({ dataset, search, filename }));
    assert.equal(
      crumbs.length, expected.length,
      `${name}: longitud debe ser ${expected.length}, es ${crumbs.length}`
    );
    for (let i = 0; i < expected.length; i++) {
      assert.equal(
        crumbs[i].label, expected[i].label,
        `${name}[${i}]: label debe ser "${expected[i].label}", es "${crumbs[i].label}"`
      );
      assert.equal(
        crumbs[i].href, expected[i].href,
        `${name}[${i}]: href debe ser "${expected[i].href}", es "${crumbs[i].href}"`
      );
    }
  }
});
