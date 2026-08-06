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
