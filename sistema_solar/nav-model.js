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

// Mapping de filename a page id estructural. Ninguno ≠ ficha o página desconocida.
const PAGE_IDS = {
  "index.html": "index",
  "indice.html": "indice"
};

export function resolveContext({ dataset = {}, search = "", filename = "" }) {
  const querySlug = new URLSearchParams(search).get("slug");
  const slug = dataset.slug ?? dataset.universeSlug ?? querySlug;
  const entry = slug ? entryBySlug(slug) : null;

  if (entry) {
    const kind = entry.group === "solar" ? "body"
      : entry.group === "constellations" ? "constellation"
      : "universe";
    return { kind, slug: entry.slug, name: entry.name, page: null };
  }
  return {
    kind: "page",
    slug: null,
    name: PAGE_NAMES[filename] ?? "Universo",
    page: PAGE_IDS[filename] ?? null
  };
}

export function breadcrumbFor(context) {
  const crumbs = [{ label: "Explora", href: "../index.html" }];

  if (context.page === "index") {
    crumbs.push({ label: "Universo", href: null });
    return crumbs;
  }
  crumbs.push({ label: "Universo", href: "./index.html" });

  if (context.page === "indice") {
    crumbs.push({ label: "Índice", href: null });
    return crumbs;
  }
  crumbs.push({ label: "Índice", href: "./indice.html" });
  crumbs.push({ label: context.name, href: null });
  return crumbs;
}
