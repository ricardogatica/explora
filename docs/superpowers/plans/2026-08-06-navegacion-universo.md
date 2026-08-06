# Navegación del universo — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un visitante pueda recorrer las 207 entidades del módulo `sistema_solar/` mediante un índice, migas de pan y salto entre hermanos, sin tocar la escena 3D ni los datos educativos.

**Architecture:** Toda la lógica de navegación vive en `nav-model.js`, un módulo puro sin DOM ni Three.js que deriva el catálogo de los mismos datos que alimentan la escena. `nav.js` es una capa fina que inyecta el resultado en el `.side-card` existente de cada página, e `indice.js` lo renderiza como listado filtrable. Esta separación es lo que permite tests reales sin instalar dependencias: el modelo se prueba con `node --test`, y la capa DOM se verifica con comprobaciones de integridad más una pasada manual en navegador.

**Tech Stack:** HTML, CSS y módulos ES servidos tal cual, sin build. Three.js 0.185.0 por importmap desde unpkg (sin cambios). Tests con el runner integrado de Node 22 (`node --test`), sin `package.json` ni dependencias.

## Global Constraints

- **Cero dependencias nuevas y cero paso de build.** El sitio se sirve con `./run.sh` (python3 http.server). No se añade `package.json`, ni npm, ni bundler.
- **La escena 3D no cambia.** `nav.js` solo toca DOM fuera del `<canvas>`. Ni `main.js`, ni `body.js`, ni los renderers se modifican en este ciclo.
- **Los datos educativos no se tocan.** Gravedad, distancias, períodos y descripciones quedan como están, con sus imprecisiones. La única edición de datos permitida es añadir la bandera `generated:true` a las estrellas generadas (metadato, no contenido).
- **Las URLs actuales no cambian.** `sistema_solar/index.html` sigue siendo la escena 3D.
- **`nav-model.js` no puede importar Three.js.** Es lo que permite al índice compartir los datos de la escena sin cargar el motor 3D. Verificado: `data.js` importa limpio en Node (13 exports).
- **Idioma:** todo el texto visible al usuario en español, con los nombres tal como aparecen en los datos (`Luna`, `Acuario`, `Próxima Centauri`).
- **Hermanos sin vuelta circular.** Los extremos tienen un solo vecino.
- **Rama:** `feature/navegacion-universo`. Commit por tarea.

## Inventario de referencia

Cifras verificadas sobre los datos reales; los tests las usan como aserciones.

| Grupo | Cantidad | Orden | Destino |
|---|---|---|---|
| Sistema solar | 10 | `BODY_ORDER` (9) con `moon` insertada tras `earth` | `earth.html` |
| Estrellas | 108 | `distanceLy` ascendente | `sirius.html` o `star.html?slug=` |
| Constelaciones | 88 | Alfabético español | `constellations.html?slug=` |
| Galaxias | 1 | — | `milky-way.html` |
| **Total** | **207** | | |

Datos concretos confirmados:

- `BODY_ORDER` = `["sun","mercury","venus","earth","mars","jupiter","saturn","uranus","neptune"]` — **9 entradas, sin la Luna**.
- `BODY_DATA.moon.parent === "earth"`, `BODY_DATA.moon.name === "Luna"`.
- Estrellas por distancia ascendente: `proxima-centauri` (4,24), `rigil-kentaurus` (4,37), `sirius` (8,6), `procyon` (11,5) … `ton-618` (10.400.000.000) última.
- Constelaciones alfabéticas: `Acuario` primera, `Zorra` última.
- 9 estrellas con ficha propia; 99 servidas por `star.html?slug=` (ejemplo: `alpheratz`).
- 84 de las 88 constelaciones llevan ya `generated:true`.
- Entradas marcables como aproximadas: **183** (99 estrellas + 84 constelaciones).

## Estructura de archivos

**Se crean:**

| Archivo | Responsabilidad |
|---|---|
| `sistema_solar/nav-model.js` | Lógica pura: catálogo, hermanos, migas, contexto. Sin DOM, sin Three.js. |
| `sistema_solar/nav.js` | Capa DOM: lee el contexto de la página e inyecta migas y hermanos en `.side-card`. |
| `sistema_solar/indice.html` | Página del índice. |
| `sistema_solar/indice.js` | Renderiza el catálogo y el filtro de texto. |
| `tests/nav-model.test.mjs` | Tests del modelo. |
| `tests/integridad.test.mjs` | Destinos resolubles, simetría de hermanos, enlaces no rotos, cableado de páginas. |

**Se modifican:**

| Archivo | Cambio |
|---|---|
| `sistema_solar/universe/stars.js:35-52` | Añadir `generated:true` a las estrellas generadas. |
| `sistema_solar/styles.css` | Estilos de miga y `.atlas-back` (traído desde el HTML en línea). |
| `sistema_solar/index.html` | Quitar el `<style>` en línea de `.atlas-back`; añadir botón «Índice» al HUD; cargar `nav.js`. |
| 24 HTML restantes de `sistema_solar/` | Una línea: `<script type="module" src="./nav.js"></script>`. |
| `sistema_solar/constellations-view.js` | Soporte de `?slug=` al cargar y `history.replaceState` al enfocar. |
| `sistema_solar/universe-body.js:11` | Mensaje legible en vez de `Error` que deja la página en blanco. |
| `sistema_solar/README.md` | Documentar el índice, `nav.js` y cómo correr los tests. |

**Desviación del spec, deliberada:** el spec decía unificar el CSS de `.atlas-back` «a una hoja compartida» entre las tres materias. Al medirlo, el de `sistema_solar` es distinto a propósito (40px, borde cian, `pointer-events:auto` porque `.hud` tiene `pointer-events:none`) mientras lenguaje y matemáticas comparten uno idéntico (44px, borde blanco). Unificar los tres cambiaría el aspecto de dos materias fuera de alcance. Se mueve solo el del universo a `sistema_solar/styles.css`; la duplicación entre lenguaje y matemáticas queda para el ciclo de convenciones.

---

### Task 1: Catálogo del universo

Construye la lista de las 207 entradas agrupadas, que es la fuente de la que beben el índice, los hermanos y las migas.

**Files:**
- Create: `sistema_solar/nav-model.js`
- Modify: `sistema_solar/universe/stars.js:35-52`
- Test: `tests/nav-model.test.mjs`

**Interfaces:**
- Consumes: `data.js` (`BODY_ORDER`, `BODY_DATA`, `KNOWN_STARS`, `CONSTELLATIONS`, `KNOWN_GALAXIES`).
- Produces:
  - `NavEntry` = `{slug:string, name:string, detail:string, search:string, href:string, group:string, approximate:boolean}`
  - `search` es el texto sobre el que filtra el índice: nombre, tipo y constelación, en minúsculas. Va aparte de `detail` porque `detail` es lo que se muestra y `search` incluye datos que no caben en la tarjeta.
  - `buildCatalog(): Array<{id:string, title:string, entries:NavEntry[]}>` — 4 grupos con `id` en `"solar" | "stars" | "constellations" | "galaxies"`. El catálogo se construye una sola vez al cargar el módulo.
  - `entryBySlug(slug:string): NavEntry|null`

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/nav-model.test.mjs`:

```js
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
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `node --test tests/nav-model.test.mjs`
Expected: FAIL — `Cannot find module '../sistema_solar/nav-model.js'`

- [ ] **Step 3: Marcar las estrellas generadas**

En `sistema_solar/universe/stars.js`, dentro de `generatedStarsFromConstellations()`, el objeto que se hace `items.push(...)` empieza así:

```js
      items.push({
        slug:point.starSlug,
        kind:"star",
```

Añadir la bandera justo después de `kind`:

```js
      items.push({
        slug:point.starSlug,
        kind:"star",
        generated:true,
```

Es metadato, no contenido: no cambia ningún texto que lea el visitante.

- [ ] **Step 4: Escribir el catálogo**

Crear `sistema_solar/nav-model.js`:

```js
import {
  BODY_DATA, BODY_ORDER, CONSTELLATIONS, KNOWN_GALAXIES, KNOWN_STARS
} from "./data.js";

// La Luna no está en BODY_ORDER porque es satélite, no planeta. El índice
// la lista igualmente, tras la Tierra, para que sus 10 fichas sean alcanzables.
function solarSlugs() {
  const slugs = [...BODY_ORDER];
  slugs.splice(slugs.indexOf("earth") + 1, 0, "moon");
  return slugs;
}

// El índice filtra sobre `search`, no sobre `detail`: así se puede buscar
// «Orión» y encontrar Betelgeuse, aunque la tarjeta no muestre la constelación.
function searchText(...parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function bodyEntry(slug) {
  const body = BODY_DATA[slug];
  return {
    slug,
    name: body.name,
    detail: body.type,
    search: searchText(body.name, body.type),
    href: `${slug}.html`,
    group: "solar",
    approximate: false
  };
}

function starEntry(star) {
  return {
    slug: star.slug,
    name: star.name,
    detail: `${star.type} · ${star.distance}`,
    search: searchText(star.name, star.type, star.constellation),
    href: star.file,
    group: "stars",
    approximate: star.generated === true
  };
}

function constellationEntry(constellation) {
  return {
    slug: constellation.slug,
    name: constellation.name,
    detail: `Hemisferio ${constellation.hemisphere}`,
    search: searchText(constellation.name, "constelación", constellation.hemisphere),
    href: `constellations.html?slug=${constellation.slug}`,
    group: "constellations",
    approximate: constellation.generated === true
  };
}

function galaxyEntry(galaxy) {
  return {
    slug: galaxy.slug,
    name: galaxy.name,
    detail: galaxy.type,
    search: searchText(galaxy.name, galaxy.type, galaxy.constellation),
    href: galaxy.file,
    group: "galaxies",
    approximate: false
  };
}

function makeCatalog() {
  return [
    {
      id: "solar",
      title: "Sistema solar",
      entries: solarSlugs().map(bodyEntry)
    },
    {
      id: "stars",
      title: "Estrellas",
      entries: [...KNOWN_STARS]
        .sort((a, b) => a.distanceLy - b.distanceLy)
        .map(starEntry)
    },
    {
      id: "constellations",
      title: "Constelaciones",
      entries: [...CONSTELLATIONS]
        .sort((a, b) => a.name.localeCompare(b.name, "es"))
        .map(constellationEntry)
    },
    {
      id: "galaxies",
      title: "Galaxias",
      entries: KNOWN_GALAXIES.map(galaxyEntry)
    }
  ];
}

// Se construye una sola vez: ordenar 108 estrellas y 88 constelaciones en cada
// llamada sería gratuito aquí pero no en siblingsFor(), que se llama por ficha.
const CATALOG = makeCatalog();

const ENTRY_BY_SLUG = new Map(
  CATALOG.flatMap(group => group.entries).map(entry => [entry.slug, entry])
);

export function buildCatalog() {
  return CATALOG;
}

export function entryBySlug(slug) {
  return ENTRY_BY_SLUG.get(slug) ?? null;
}
```

- [ ] **Step 5: Correr los tests y ver que pasan**

Run: `node --test tests/nav-model.test.mjs`
Expected: PASS, 11 tests.

Si «183 entradas aproximadas» falla, comprobar que el Step 3 se aplicó: sin la bandera saldrán 84 (solo constelaciones).

- [ ] **Step 6: Commit**

```bash
git add tests/nav-model.test.mjs sistema_solar/nav-model.js sistema_solar/universe/stars.js
git commit -m "feat(nav): catálogo de las 207 entidades del universo"
```

---

### Task 2: Hermanos, migas y contexto de página

**Files:**
- Modify: `sistema_solar/nav-model.js`
- Test: `tests/nav-model.test.mjs`

**Interfaces:**
- Consumes: `buildCatalog()`, `entryBySlug()` de la Task 1.
- Produces:
  - `siblingsFor(slug:string): {prev:NavEntry|null, next:NavEntry|null}`
  - `resolveContext({dataset:object, search:string, filename:string}): {kind:"body"|"universe"|"constellation"|"page", slug:string|null, name:string}`
  - `breadcrumbFor(context): Array<{label:string, href:string|null}>` — el último elemento lleva `href:null` (es la página actual).

- [ ] **Step 1: Escribir los tests que fallan**

Añadir al final de `tests/nav-model.test.mjs`:

```js
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
```

- [ ] **Step 2: Correr los tests y ver que fallan**

Run: `node --test tests/nav-model.test.mjs`
Expected: FAIL — `siblingsFor is not a function` (los 11 de la Task 1 siguen pasando).

- [ ] **Step 3: Implementar hermanos, contexto y migas**

Añadir al final de `sistema_solar/nav-model.js`:

```js
const EMPTY_SIBLINGS = { prev: null, next: null };

// Solo dos grupos encadenan. Las constelaciones tienen su lista de 88 botones
// dentro de constellations.html, y la Luna llega a la Tierra por parentLink.
const CHAINED_GROUPS = { solar: BODY_ORDER, stars: null };

function chainFor(group) {
  const catalog = buildCatalog().find(g => g.id === group);
  if (!catalog) return [];
  const allowed = CHAINED_GROUPS[group];
  if (allowed === undefined) return [];
  return allowed ? catalog.entries.filter(e => allowed.includes(e.slug)) : catalog.entries;
}

export function siblingsFor(slug) {
  const entry = entryBySlug(slug);
  if (!entry) return EMPTY_SIBLINGS;
  const chain = chainFor(entry.group);
  const index = chain.findIndex(e => e.slug === slug);
  if (index === -1) return EMPTY_SIBLINGS;
  return { prev: chain[index - 1] ?? null, next: chain[index + 1] ?? null };
}

const PAGE_NAMES = {
  "index.html": "Universo",
  "indice.html": "Índice",
  "constellations.html": "Constelaciones",
  "solar-scale.html": "Escala planetaria",
  "referencias.html": "Referencias"
};

export function resolveContext({ dataset = {}, search = "", filename = "" }) {
  const querySlug = new URLSearchParams(search).get("slug");
  const slug = dataset.slug ?? dataset.universeSlug ?? querySlug;
  const entry = slug ? entryBySlug(slug) : null;

  if (entry) {
    const kind = entry.group === "solar" ? "body"
      : entry.group === "constellations" ? "constellation"
      : "universe";
    return { kind, slug: entry.slug, name: entry.name };
  }
  return { kind: "page", slug: null, name: PAGE_NAMES[filename] ?? "Universo" };
}

export function breadcrumbFor(context) {
  const crumbs = [{ label: "Explora", href: "../index.html" }];

  if (context.kind === "page" && context.name === "Universo") {
    crumbs.push({ label: "Universo", href: null });
    return crumbs;
  }
  crumbs.push({ label: "Universo", href: "./index.html" });

  if (context.kind === "page" && context.name === "Índice") {
    crumbs.push({ label: "Índice", href: null });
    return crumbs;
  }
  crumbs.push({ label: "Índice", href: "./indice.html" });
  crumbs.push({ label: context.name, href: null });
  return crumbs;
}
```

- [ ] **Step 4: Correr los tests y ver que pasan**

Run: `node --test tests/nav-model.test.mjs`
Expected: PASS, 27 tests.

- [ ] **Step 5: Commit**

```bash
git add tests/nav-model.test.mjs sistema_solar/nav-model.js
git commit -m "feat(nav): hermanos, contexto de página y migas de pan"
```

---

### Task 3: Test de integridad de destinos

Convierte en test automático los criterios de verificación del spec: que las 207 entradas lleven a algún sitio real y que los hermanos sean simétricos.

**Files:**
- Create: `tests/integridad.test.mjs`

**Interfaces:**
- Consumes: `buildCatalog()`, `siblingsFor()` de las Tasks 1-2; `node:fs`, `node:path`.
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Escribir el test**

Crear `tests/integridad.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog, siblingsFor } from "../sistema_solar/nav-model.js";
import { KNOWN_STAR_BY_SLUG, CONSTELLATION_BY_SLUG } from "../sistema_solar/data.js";

const UNIVERSE = join(dirname(fileURLToPath(import.meta.url)), "..", "sistema_solar");
const entries = buildCatalog().flatMap(group => group.entries);

test("las 207 entradas resuelven a un destino real", () => {
  for (const entry of entries) {
    const [file, query] = entry.href.split("?");
    assert.ok(existsSync(join(UNIVERSE, file)), `falta el archivo ${file} (${entry.slug})`);

    if (!query) continue;
    const slug = new URLSearchParams(query).get("slug");
    const known = KNOWN_STAR_BY_SLUG[slug] || CONSTELLATION_BY_SLUG[slug];
    assert.ok(known, `${entry.href} apunta a un slug que no está en los datos`);
  }
});

test("los hermanos son simétricos", () => {
  for (const entry of entries) {
    const { prev, next } = siblingsFor(entry.slug);
    if (prev) {
      assert.equal(siblingsFor(prev.slug).next?.slug, entry.slug,
        `${prev.slug} no reconoce a ${entry.slug} como siguiente`);
    }
    if (next) {
      assert.equal(siblingsFor(next.slug).prev?.slug, entry.slug,
        `${next.slug} no reconoce a ${entry.slug} como anterior`);
    }
  }
});

test("ningún enlace local roto en los HTML del universo", () => {
  const pages = readdirSync(UNIVERSE).filter(name => name.endsWith(".html"));
  for (const page of pages) {
    const html = readFileSync(join(UNIVERSE, page), "utf8");
    const targets = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
    for (const target of targets) {
      if (/^(https?:|#|mailto:|data:)/.test(target)) continue;
      const file = target.split("?")[0];
      assert.ok(existsSync(join(UNIVERSE, file)), `${page} enlaza a ${file}, que no existe`);
    }
  }
});
```

- [ ] **Step 2: Correr el test y ver que pasa**

Run: `node --test tests/integridad.test.mjs`
Expected: PASS, 3 tests.

Este test pasa desde el primer momento y debe seguir pasando en cada tarea
posterior: es la red que detecta si el índice empieza a emitir destinos que no
existen. Ninguna entrada del catálogo apunta a `indice.html`, así que la página
de la Task 8 no le afecta.

- [ ] **Step 3: Correr la suite completa**

Run: `node --test`
Expected: PASS, 30 tests.

- [ ] **Step 4: Commit**

```bash
git add tests/integridad.test.mjs
git commit -m "test(nav): integridad de destinos, simetría de hermanos y enlaces"
```

---

### Task 4: Capa DOM `nav.js` y estilos

**Files:**
- Create: `sistema_solar/nav.js`
- Modify: `sistema_solar/styles.css`

**Interfaces:**
- Consumes: `resolveContext()`, `breadcrumbFor()`, `siblingsFor()` de las Tasks 1-2.
- Produces: efecto secundario al cargar — inserta `<nav class="crumbs">` como primer hijo del `.side-card` y `<nav class="siblings">` dentro de `.bottom-actions` (o al final del `.side-card` si no existe).

- [ ] **Step 1: Añadir los estilos**

Al final de `sistema_solar/styles.css`:

```css
.atlas-back{display:inline-flex;align-items:center;gap:.5rem;min-height:40px;margin-bottom:10px;padding:7px 13px 7px 11px;border:1px solid rgba(56,189,248,.35);border-radius:999px;background:rgba(14,24,44,.9);color:#e2e8f0;font-size:12px;font-weight:700;text-decoration:none;pointer-events:auto}
.atlas-back:hover{border-color:#38bdf8;color:#fff}
.atlas-back:focus-visible{outline:2px solid #38bdf8;outline-offset:2px}
.crumbs{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:0 0 10px;font-size:12px;font-weight:700;pointer-events:auto}
.crumbs a{color:#7dd3fc;text-decoration:none;padding:2px 4px;border-radius:6px}
.crumbs a:hover{color:#fff;background:rgba(56,189,248,.16)}
.crumbs a:focus-visible{outline:2px solid #38bdf8;outline-offset:1px}
.crumbs span[aria-current]{color:#e2e8f0}
.crumbs i{color:#64748b;font-style:normal}
.siblings{display:flex;justify-content:space-between;gap:8px;width:100%;margin-top:10px;pointer-events:auto}
.siblings .btn{flex:0 1 auto}
.siblings .btn--next{margin-left:auto}
```

- [ ] **Step 2: Escribir `nav.js`**

Crear `sistema_solar/nav.js`:

```js
import { breadcrumbFor, resolveContext, siblingsFor } from "./nav-model.js";

const context = resolveContext({
  dataset: document.body.dataset,
  search: location.search,
  filename: location.pathname.split("/").pop() || "index.html"
});

function renderCrumbs() {
  const nav = document.createElement("nav");
  nav.className = "crumbs";
  nav.setAttribute("aria-label", "Ruta de navegación");

  breadcrumbFor(context).forEach((crumb, index) => {
    if (index > 0) {
      const separator = document.createElement("i");
      separator.setAttribute("aria-hidden", "true");
      separator.textContent = "›";
      nav.appendChild(separator);
    }
    if (crumb.href) {
      const link = document.createElement("a");
      link.href = crumb.href;
      link.textContent = crumb.label;
      nav.appendChild(link);
    } else {
      const current = document.createElement("span");
      current.setAttribute("aria-current", "page");
      current.textContent = crumb.label;
      nav.appendChild(current);
    }
  });
  return nav;
}

function renderSiblings() {
  const { prev, next } = siblingsFor(context.slug);
  if (!prev && !next) return null;

  const nav = document.createElement("nav");
  nav.className = "siblings";
  nav.setAttribute("aria-label", "Cuerpos vecinos");

  if (prev) {
    const link = document.createElement("a");
    link.className = "btn btn--prev";
    link.href = prev.href;
    link.textContent = `‹ ${prev.name}`;
    nav.appendChild(link);
  }
  if (next) {
    const link = document.createElement("a");
    link.className = "btn btn--next";
    link.href = next.href;
    link.textContent = `${next.name} ›`;
    nav.appendChild(link);
  }
  return nav;
}

const card = document.querySelector(".side-card") || document.querySelector(".panel");
if (card) {
  card.insertBefore(renderCrumbs(), card.firstChild);
  const siblings = renderSiblings();
  if (siblings) (card.querySelector(".bottom-actions") || card).appendChild(siblings);
}
```

- [ ] **Step 3: Comprobar a mano en el navegador**

```bash
./run.sh
```

Abrir `http://localhost:6767/sistema_solar/earth.html`. Verificar:
- Arriba del panel aparece `Explora › Universo › Índice › Tierra`.
- Abajo aparecen `‹ Venus` y `Marte ›`.
- «Índice» da 404 todavía — lo crea la Task 8. Es esperado.
- La escena 3D gira igual que antes.

Detener con Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add sistema_solar/nav.js sistema_solar/styles.css
git commit -m "feat(nav): capa DOM de migas y hermanos"
```

---

### Task 5: Cablear las 25 páginas existentes

**Files:**
- Modify: los 25 `.html` de `sistema_solar/`
- Test: `tests/integridad.test.mjs`

**Interfaces:**
- Consumes: `nav.js` de la Task 4.
- Produces: todas las páginas del universo con navegación.

- [ ] **Step 1: Escribir el test que falla**

Añadir a `tests/integridad.test.mjs`:

```js
test("las páginas del universo cargan nav.js", () => {
  const pages = readdirSync(UNIVERSE).filter(name => name.endsWith(".html"));
  assert.ok(pages.length >= 25, `esperaba al menos 25 páginas, hay ${pages.length}`);
  for (const page of pages) {
    const html = readFileSync(join(UNIVERSE, page), "utf8");
    assert.match(html, /src="\.\/nav\.js"/, `${page} no carga nav.js`);
  }
});

test("ninguna página duplica el CSS de .atlas-back en línea", () => {
  const pages = readdirSync(UNIVERSE).filter(name => name.endsWith(".html"));
  for (const page of pages) {
    const html = readFileSync(join(UNIVERSE, page), "utf8");
    assert.doesNotMatch(html, /\.atlas-back\{/, `${page} todavía lleva el CSS en línea`);
  }
});
```

- [ ] **Step 2: Correr el test y ver que falla**

Run: `node --test tests/integridad.test.mjs`
Expected: FAIL — `index.html no carga nav.js`.

- [ ] **Step 3: Añadir el script a las 23 páginas con script propio**

23 de las 24 terminan con `<script type="module" src="./body.js"></script>`,
`./universe-body.js`, `./solar-scale.js` o `./constellations-view.js`. Añadir
`nav.js` justo después, en su propia línea:

```bash
cd sistema_solar
for page in *.html; do
  [ "$page" = "index.html" ] && continue
  perl -0pi -e 's{(<script type="module" src="\./(?:body|universe-body|solar-scale|constellations-view)\.js"></script>)}{$1\n  <script type="module" src="./nav.js"></script>}' "$page"
done
cd ..
```

**`referencias.html` es la excepción: no tiene ningún `<script>`**, así que el
comando anterior no la toca. Añadirle la línea a mano justo antes de `</body>`:

```html
  <script type="module" src="./nav.js"></script>
</body>
```

Verificar que solo falta `index.html`:

```bash
grep -L 'nav\.js' sistema_solar/*.html
```

Expected: solo `sistema_solar/index.html`. Si también aparece `referencias.html`,
la edición a mano no se aplicó.

- [ ] **Step 4: Actualizar `index.html` a mano**

En `sistema_solar/index.html` hay dos cambios. El botón «Índice del universo»
**no** se añade aquí: `indice.html` no existe hasta la Task 8, y el test de
enlaces rotos de la Task 3 fallaría. Lo añade la Task 8.

Primero, borrar el bloque `<style>` de las líneas 8-12 completo:

```html
  <style>
    .atlas-back{display:inline-flex;...}
    .atlas-back:hover{border-color:#38bdf8;color:#fff}
    .atlas-back:focus-visible{outline:2px solid #38bdf8;outline-offset:2px}
  </style>
```

Segundo, cargar `nav.js` tras `main.js`:

```html
  <script type="module" src="./main.js"></script>
  <script type="module" src="./nav.js"></script>
```

El `<a class="atlas-back" href="../index.html">` del `title-panel` se queda: `nav.js` pone la miga en el `.side-card`, y en la escena el panel es `.title-panel`, así que no se pisan.

- [ ] **Step 5: Correr los tests y ver que pasan**

Run: `node --test`
Expected: PASS, 32 tests.

- [ ] **Step 6: Comprobar en el navegador que la escena sigue intacta**

```bash
./run.sh
```

Abrir `http://localhost:6767/sistema_solar/index.html`: la escena 3D, la línea temporal y el zoom funcionan igual, y el botón «Índice del universo» aparece entre los demás. Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add sistema_solar/*.html
git commit -m "feat(nav): cargar la navegación en las 25 páginas del universo"
```

---

### Task 6: Deep-link de constelaciones

Sin esto, las 88 entradas de constelación del índice llegan a la página pero no enfocan nada.

**Files:**
- Modify: `sistema_solar/constellations-view.js:84`

**Interfaces:**
- Consumes: `CONSTELLATIONS`, y la función `focusEntry(entry)` y el array `atlas` que ya existen en el archivo.
- Produces: `constellations.html?slug=<slug>` abre esa constelación enfocada; pulsar otra actualiza la URL sin recargar.

- [ ] **Step 1: Leer el archivo para situarse**

Run: `sed -n '78,95p' sistema_solar/constellations-view.js`

Localizar el bucle que crea los 88 botones y llama a `focusEntry(atlas.find(...))`, y ver qué se ejecuta después para saber dónde encaja el enfoque inicial.

- [ ] **Step 2: Aplicar el enfoque inicial desde la URL**

Justo después del bucle que rellena `listEl`, añadir:

```js
  const requestedSlug = new URLSearchParams(location.search).get("slug");
  const requested = requestedSlug && atlas.find(item => item.slug === requestedSlug);
  if (requested) focusEntry(requested);
```

- [ ] **Step 3: Reflejar la constelación activa en la URL**

Dentro de `focusEntry`, al final del cuerpo de la función, añadir:

```js
  history.replaceState(null, "", `?slug=${entry.slug}`);
```

Se usa `replaceState` y no `pushState` a propósito: pulsar 20 constelaciones no debe dejar 20 entradas en el historial que el visitante tenga que deshacer una por una para salir.

- [ ] **Step 4: Comprobar a mano**

```bash
./run.sh
```

1. Abrir `http://localhost:6767/sistema_solar/constellations.html?slug=orion` → arranca con Orión enfocada.
2. Pulsar «Escorpio» en la lista → la URL pasa a `?slug=scorpius`.
3. Recargar → sigue en Escorpio.
4. Abrir `constellations.html` sin query → comportamiento de siempre, sin errores en consola.
5. Abrir `constellations.html?slug=inventada` → no rompe, se comporta como sin query.

Ctrl+C.

- [ ] **Step 5: Correr los tests**

Run: `node --test`
Expected: PASS, 32 tests.

- [ ] **Step 6: Commit**

```bash
git add sistema_solar/constellations-view.js
git commit -m "feat(nav): enlazar constelaciones concretas con ?slug="
```

---

### Task 7: Error legible en las fichas del universo

`universe-body.js:11` lanza `Error` y deja la página en blanco. El índice convierte esas URLs en enlaces de primera clase, así que un slug mal escrito tiene que explicarse.

**Files:**
- Modify: `sistema_solar/universe-body.js:7-12`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `star.html?slug=loquesea` muestra un mensaje con enlace al índice en vez de una página en blanco.

- [ ] **Step 1: Ver el estado actual**

Run: `sed -n '1,14p' sistema_solar/universe-body.js`

Confirmar que la línea 11 es un `throw new Error(...)` dentro del bloque que se ejecuta cuando `object` es falsy.

- [ ] **Step 2: Sustituir el throw por un mensaje**

Reemplazar el bloque que hoy lanza el error por:

```js
if (!object) {
  const shell = document.createElement("div");
  shell.className = "hud";
  shell.innerHTML = `
    <section class="panel side-card">
      <nav class="crumbs" aria-label="Ruta de navegación">
        <a href="../index.html">Explora</a>
        <i aria-hidden="true">›</i>
        <a href="./index.html">Universo</a>
        <i aria-hidden="true">›</i>
        <span aria-current="page">No encontrado</span>
      </nav>
      <p class="eyebrow">Archivo del universo</p>
      <h1>No encontramos ese objeto</h1>
      <p>El identificador <code id="slugEcho"></code> no corresponde a ninguna
      estrella ni galaxia de esta maqueta.</p>
      <div class="bottom-actions">
        <a class="btn" href="./indice.html">Ver el índice del universo</a>
        <a class="btn" href="./index.html">Volver a la escena 3D</a>
      </div>
    </section>`;
  shell.querySelector("#slugEcho").textContent = slug || "(vacío)";
  document.body.replaceChildren(shell);
  throw new Error(`Universe object not found: ${slug}`);
}
```

**El slug se escribe con `textContent`, nunca interpolado en `innerHTML`.**
Viene de la barra de direcciones: interpolarlo permitiría que
`star.html?slug=<img src=x onerror=…>` inyectara HTML en la página. El resto
de la plantilla es literal y no lleva datos, así que ahí `innerHTML` es seguro.

El `throw` se mantiene después de pintar el mensaje: corta la ejecución del resto del módulo, que daría errores en cascada al intentar leer propiedades de `object`. La diferencia es que ahora el visitante ve algo útil antes de que se corte.

La miga va escrita a mano y no por `nav.js` porque este código reemplaza el `<body>` entero, borrando lo que `nav.js` hubiera inyectado.

- [ ] **Step 3: Comprobar a mano**

```bash
./run.sh
```

- `http://localhost:6767/sistema_solar/star.html?slug=inventada` → mensaje legible con los dos botones.
- `http://localhost:6767/sistema_solar/star.html?slug=alpheratz` → ficha normal de Alpheratz.
- `http://localhost:6767/sistema_solar/sirius.html` → ficha normal de Sirio.
- `http://localhost:6767/sistema_solar/star.html?slug=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E`
  → el mensaje muestra el texto `<img src=x onerror=alert(1)>` literal dentro
  del `<code>`. **No debe aparecer ninguna alerta ni imagen rota**: si aparece,
  el slug se está interpolando en `innerHTML` en vez de asignarse con
  `textContent`.
- El botón «Ver el índice del universo» da 404 hasta la Task 8. Es esperado.

Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add sistema_solar/universe-body.js
git commit -m "fix(nav): mensaje legible cuando el slug del universo no existe"
```

---

### Task 8: La página del índice

**Files:**
- Create: `sistema_solar/indice.html`, `sistema_solar/indice.js`
- Modify: `sistema_solar/styles.css`

**Interfaces:**
- Consumes: `buildCatalog()` de la Task 1; `nav.js` de la Task 4 para la miga.
- Produces: `sistema_solar/indice.html`, destino de la miga «Índice» de las 21 fichas y del botón del HUD.

- [ ] **Step 1: Crear la página**

Crear `sistema_solar/indice.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Índice del universo</title>
  <link rel="icon" href="./favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="./styles.css" />
</head>
<body class="indice-page">
  <main class="indice">
    <section class="panel side-card indice__head">
      <p class="eyebrow">Índice</p>
      <h1>Todo el universo</h1>
      <p>207 fichas entre cuerpos del sistema solar, estrellas, constelaciones y galaxias.</p>
      <input id="filtro" class="indice__filter" type="search"
             placeholder="Filtrar por nombre, tipo o constelación…"
             aria-label="Filtrar el índice" autocomplete="off" />
      <p id="conteo" class="indice__count" role="status"></p>
    </section>
    <div id="grupos"></div>
  </main>
  <script type="module" src="./indice.js"></script>
  <script type="module" src="./nav.js"></script>
</body>
</html>
```

No lleva importmap: esta página no usa Three.js, y `nav-model.js` tampoco.

- [ ] **Step 2: Escribir el renderizado y el filtro**

Crear `sistema_solar/indice.js`:

```js
import { buildCatalog } from "./nav-model.js";

const catalog = buildCatalog();
const groupsEl = document.getElementById("grupos");
const filterEl = document.getElementById("filtro");
const countEl = document.getElementById("conteo");

const total = catalog.reduce((n, group) => n + group.entries.length, 0);

function render(query = "") {
  const needle = query.trim().toLowerCase();
  groupsEl.textContent = "";
  let shown = 0;

  for (const group of catalog) {
    const matches = needle
      ? group.entries.filter(entry => entry.search.includes(needle))
      : group.entries;
    if (!matches.length) continue;
    shown += matches.length;

    const section = document.createElement("section");
    section.className = "panel indice__group";

    const heading = document.createElement("h2");
    heading.textContent = `${group.title} (${matches.length})`;
    section.appendChild(heading);

    const list = document.createElement("ul");
    list.className = "indice__list";

    for (const entry of matches) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "indice__item";
      link.href = entry.href;

      const name = document.createElement("strong");
      name.textContent = entry.name;
      link.appendChild(name);

      const detail = document.createElement("span");
      detail.textContent = entry.detail;
      link.appendChild(detail);

      if (entry.approximate) {
        const badge = document.createElement("em");
        badge.className = "indice__badge";
        badge.textContent = "datos aproximados";
        link.appendChild(badge);
      }
      item.appendChild(link);
      list.appendChild(item);
    }
    section.appendChild(list);
    groupsEl.appendChild(section);
  }

  countEl.textContent = needle
    ? `${shown} de ${total} fichas`
    : `${total} fichas`;
}

filterEl.addEventListener("input", () => render(filterEl.value));
render();
```

Se usa `textContent` y no `innerHTML` en cada entrada a propósito: los nombres salen de los datos y no hay razón para interpretarlos como HTML.

- [ ] **Step 3: Añadir los estilos del índice**

Al final de `sistema_solar/styles.css`:

```css
.indice-page{margin:0;padding:0;background:#020617;overflow:auto}
.indice{max-width:1100px;margin:0 auto;padding:24px 18px 60px;display:grid;gap:16px}
.indice__head{position:static;width:auto;max-height:none}
.indice__filter{width:100%;margin-top:12px;padding:10px 12px;border:1px solid rgba(56,189,248,.35);border-radius:12px;background:rgba(2,6,23,.85);color:#e2e8f0;font-size:14px}
.indice__filter:focus-visible{outline:2px solid #38bdf8;outline-offset:1px}
.indice__count{margin:8px 0 0;color:#94a3b8;font-size:12px;font-weight:700}
.indice__group{padding:18px}
.indice__group h2{margin:0 0 12px;font-size:18px}
.indice__list{list-style:none;margin:0;padding:0;display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
.indice__item{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border:1px solid rgba(148,163,184,.18);border-radius:12px;color:#e2e8f0;text-decoration:none}
.indice__item:hover{border-color:#38bdf8;background:rgba(56,189,248,.08)}
.indice__item:focus-visible{outline:2px solid #38bdf8;outline-offset:2px}
.indice__item span{color:#94a3b8;font-size:12px}
.indice__badge{color:#fbbf24;font-size:11px;font-style:normal;font-weight:700}
```

- [ ] **Step 4: Enlazar el índice desde la escena 3D**

Ahora que `indice.html` existe, añadir el botón en `sistema_solar/index.html`,
entre los botones de la `info-panel`, después del enlace a `solar-scale.html`:

```html
        <a class="btn" href="./indice.html">Índice del universo</a>
```

Va aquí y no en la Task 5 a propósito: añadirlo antes de que la página existiera
habría roto el test de enlaces locales de la Task 3.

- [ ] **Step 5: Correr los tests**

Run: `node --test`
Expected: PASS, 32 tests. El test «las páginas del universo cargan nav.js» ahora cubre también `indice.html`, y el de enlaces locales valida tanto los destinos de la nueva página como el botón recién añadido.

- [ ] **Step 6: Comprobar a mano**

```bash
./run.sh
```

En `http://localhost:6767/sistema_solar/indice.html`:
- Cuatro grupos con 10, 108, 88 y 1 entradas; el contador dice «207 fichas».
- Escribir `mar` en el filtro → aparece Marte, y el contador baja. Ojo: NO aparece
Mercurio (su texto de busqueda no contiene «mar»), y si aparecen estrellas cuyo tipo
contiene «amarilla». Es coincidencia por subcadena, aceptada a proposito: exigir
coincidencia al inicio de palabra romperia que «gigante» encuentre «supergigante».
- Escribir `orión` → salen la constelación y sus estrellas (Betelgeuse, Rigel,
  Alnitak…), porque el filtro mira `search`, que incluye la constelación de
  cada estrella aunque la tarjeta no la muestre.
- Escribir `xyz` → no queda ningún grupo, el contador dice «0 de 207 fichas».
- Pulsar «Alpheratz» → abre `star.html?slug=alpheratz`, con su ficha y su miga.
- Pulsar «Orión» → abre `constellations.html?slug=orion` con Orión enfocada.
- Las entradas generadas llevan la marca ámbar «datos aproximados»; Tierra y Sirio no.
- Con el teclado: Tab recorre el filtro y los enlaces con foco visible.
- A 360px de ancho, la rejilla cae a una columna y no hay scroll horizontal.

Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add sistema_solar/indice.html sistema_solar/indice.js sistema_solar/styles.css sistema_solar/index.html
git commit -m "feat(nav): índice filtrable de las 207 fichas del universo"
```

---

### Task 9: Verificación final y documentación

**Files:**
- Modify: `sistema_solar/README.md`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: el ciclo cerrado y documentado.

- [ ] **Step 1: Correr la suite completa**

Run: `node --test`
Expected: PASS, 32 tests, 0 fallos.

- [ ] **Step 2: Recorrido manual de los criterios del spec**

```bash
./run.sh
```

Con `http://localhost:6767` abierto, comprobar uno por uno:

1. Portada → «Universo» → escena 3D. La URL sigue siendo `/sistema_solar/index.html`.
2. Desde la escena, botón «Índice del universo» → `indice.html`.
3. Desde el índice, abrir Tierra → miga completa `Explora › Universo › Índice › Tierra`.
4. En la Tierra, pulsar `Marte ›` → ficha de Marte, que ofrece `‹ Tierra` y `Júpiter ›`.
5. En el Sol solo aparece `Mercurio ›`; en Neptuno solo `‹ Urano`.
6. En la Luna no hay hermanos, pero sí el botón «Ver archivo de la Tierra».
7. Desde cualquier ficha, «Explora» va a la portada en un clic.
8. `solar-scale.html` y `referencias.html` tienen miga sin hermanos.
9. La escena 3D se ve como antes: planetas girando, línea temporal, zoom.

Ctrl+C.

- [ ] **Step 3: Documentar**

En `sistema_solar/README.md`, sustituir la sección `## Archivos` por:

```markdown
## Archivos
- `index.html`: vista principal del universo, sistema solar y evolución de la Tierra.
- `indice.html`: índice filtrable de las 207 fichas (cuerpos, estrellas, constelaciones, galaxias).
- `sun.html`, `mercury.html`, `venus.html`, `earth.html`, `moon.html`, `mars.html`, `jupiter.html`, `saturn.html`, `uranus.html`, `neptune.html`.
- `star.html?slug=<slug>`: plantilla que sirve las 99 estrellas sin ficha propia.
- `bodies/*.js`: datos, comportamiento temporal y etapas propias de cada cuerpo.
- `solar-system.js`: orden, línea temporal y fórmulas de órbita.
- `universe/*.js`: estrellas conocidas y constelaciones.
- `nav-model.js`: catálogo, hermanos y migas. Lógica pura, sin DOM ni Three.js.
- `nav.js`: inyecta migas y hermanos en cada página.
- `styles.css`, `data.js`, `main.js`, `body.js`.

## Tests

Desde la raíz del repositorio:

```bash
node --test
```

Requiere Node 18 o superior. No hay dependencias que instalar.
```

- [ ] **Step 4: Commit**

```bash
git add sistema_solar/README.md
git commit -m "docs: índice, navegación y cómo correr los tests"
```

- [ ] **Step 5: Revisar la rama completa**

```bash
git log --oneline main..HEAD
git diff main --stat
```

Expected: 9 commits. El diff no debe tocar `main.js`, `body.js`, `body-renderer.js`, `star-renderer.js`, `galaxy-renderer.js`, `solar-system.js`, `bodies/*`, `lenguaje/` ni `matematicas/`.

---

## Cobertura del spec

| Requisito del spec | Tarea |
|---|---|
| `indice.html` con las 207 entradas agrupadas | 1, 8 |
| Filtro client-side sobre nombre, tipo y constelación | 1 (campo `search`), 8 |
| Migas y hermanos en las 21 fichas | 2, 4, 5 |
| Ruta a la portada desde las 26 páginas | 2, 4, 5 |
| `?slug=` en `constellations-view.js` | 6 |
| Marca «datos aproximados» en las 183 generadas | 1, 8 |
| Orden: `BODY_ORDER` + Luna, estrellas por distancia, constelaciones alfabéticas | 1 |
| Hermanos sin vuelta circular, Luna sin hermanos | 2 |
| `constellations.html` conserva su lista interna | 2 |
| Mensaje legible en `universe-body.js` | 7 |
| `.atlas-back` fuera del HTML en línea | 4, 5 |
| Verificación 1: destinos resolubles | 3 |
| Verificación 2: portada a un clic | 2, 9 |
| Verificación 3: hermanos simétricos | 3 |
| Verificación 4: sin enlaces rotos | 3 |
| Verificación 5: `data.js` sin Three.js | 1 (implícito: los tests corren en Node) |
| Riesgo: `.side-card` a 360px | 8, 9 |
| Escena 3D intacta | 5, 9 |
