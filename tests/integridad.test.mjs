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

test("cada mapa declarado por un cuerpo existe en disco", async () => {
  const { BODY_DATA } = await import("../sistema_solar/data.js");
  let declarados = 0;
  for (const [slug, body] of Object.entries(BODY_DATA)) {
    for (const [nombre, ruta] of Object.entries(body.textures ?? {})) {
      declarados++;
      // Las rutas son relativas a las páginas, que viven en sistema_solar/.
      assert.ok(existsSync(join(UNIVERSE, ruta)),
        `${slug}.${nombre} apunta a ${ruta}, que no existe`);
    }
  }
  assert.ok(declarados >= 16, `esperaba al menos 16 mapas declarados, hay ${declarados}`);
});

test("el Sol es el único cuerpo con material emisivo", async () => {
  const { BODY_DATA } = await import("../sistema_solar/data.js");
  const emisivos = Object.entries(BODY_DATA).filter(([, b]) => b.emissive).map(([s]) => s);
  assert.deepEqual(emisivos, ["sun"],
    "solo el Sol emite luz propia; el resto debe recibirla para que se vea el terminador");
});

test("solo tienen halo atmosférico los cuerpos con nubes", async () => {
  const { BODY_DATA } = await import("../sistema_solar/data.js");
  for (const [slug, body] of Object.entries(BODY_DATA)) {
    if (!body.atmosphere) continue;
    assert.ok(body.textures?.clouds,
      `${slug} declara atmósfera pero no tiene mapa de nubes: el halo quedaría flotando sobre una superficie desnuda`);
  }
});

test("las lunas interiores orbitan más rápido que las exteriores", async () => {
  // Tercera ley de Kepler. Los números están escritos a mano, así que conviene
  // que algo vigile que nadie los desordene al añadir una luna.
  const { BODY_DATA } = await import("../sistema_solar/data.js");
  let comprobados = 0;
  for (const [slug, body] of Object.entries(BODY_DATA)) {
    const lunas = [...(body.satellites ?? [])].sort((a, b) => a.orbitRadius - b.orbitRadius);
    for (let i = 1; i < lunas.length; i++) {
      comprobados++;
      assert.ok(lunas[i].orbitSpeed < lunas[i - 1].orbitSpeed,
        `en ${slug}, ${lunas[i].name} orbita más lejos que ${lunas[i - 1].name} pero no más despacio`);
    }
  }
  assert.ok(comprobados >= 8, `esperaba al menos 8 pares que comparar, hubo ${comprobados}`);
});

test("las lunas no orbitan dentro del planeta ni dentro de los anillos", async () => {
  const { BODY_DATA } = await import("../sistema_solar/data.js");
  const RING_OUTER = 2.27;   // igual que RING_OUTER_SCALE en body-renderer.js
  for (const [slug, body] of Object.entries(BODY_DATA)) {
    const limite = body.textures?.ring ? body.radius * RING_OUTER : body.radius;
    for (const luna of body.satellites ?? []) {
      assert.ok(luna.orbitRadius - luna.radius > limite,
        `en ${slug}, ${luna.name} orbitaría por dentro de ${body.textures?.ring ? "los anillos" : "el planeta"}`);
    }
  }
});

test("las páginas del universo cargan nav.js", () => {
  const pages = readdirSync(UNIVERSE).filter(name => name.endsWith(".html"));
  assert.ok(pages.length >= 25, `esperaba al menos 25 páginas, hay ${pages.length}`);
  for (const page of pages) {
    const html = readFileSync(join(UNIVERSE, page), "utf8");
    assert.match(html, /src="\.\/nav\.js"/, `${page} no carga nav.js`);
  }
});

// nav.js se salta index.html a propósito, así que "carga nav.js" no basta como
// prueba de que hay ruta a la portada: index.html tiene que traerla escrita.
// El test anterior solo miraba el nav.js y por eso no vio que el único
// ← Explora de index.html vive dentro de .title-panel, oculto bajo 780px.
const NAV_SKIPS = new Set(["index.html"]);

// El umbral es un suelo, no una igualdad: añadir una página al módulo es
// legítimo y no debe romper este test. Lo que se comprueba es que TODAS
// lleguen a la portada, no cuántas haya. El suelo solo protege de que el
// glob deje de encontrar archivos y el bucle pase en vacío.
test("todas las páginas llegan a la portada: o enlazan ../index.html o cargan nav.js", () => {
  const pages = readdirSync(UNIVERSE).filter(name => name.endsWith(".html"));
  assert.ok(pages.length >= 26, `esperaba al menos 26 páginas, hay ${pages.length}`);
  for (const page of pages) {
    const html = readFileSync(join(UNIVERSE, page), "utf8");
    const linkToHome = html.includes('href="../index.html"');
    const loadsNav = /src="\.\/nav\.js"/.test(html);
    const injectsCrumbs = loadsNav && !NAV_SKIPS.has(page);
    assert.ok(
      linkToHome || injectsCrumbs,
      `${page} no tiene la portada a un clic: ni enlaza ../index.html ni recibe migas de nav.js`
    );
  }
});

test("index.html conserva la ruta a la portada bajo 780px sin duplicarla arriba", () => {
  // Regresión de I3: .title-panel se oculta en @media (max-width:780px) y con
  // ella se iba el único enlace a la portada de esta página.
  const html = readFileSync(join(UNIVERSE, "index.html"), "utf8");
  assert.match(
    html, /class="atlas-back atlas-back--mobile"\s+href="\.\.\/index\.html"/,
    "index.html necesita su propio enlace a la portada fuera de .title-panel"
  );

  // Los comentarios se quitan primero: hablan de "@media" y confundirían al
  // recorte de bloques de abajo.
  const css = readFileSync(join(UNIVERSE, "styles.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const mobileBlocks = [...css.matchAll(/@media \(max-width:780px\)\{((?:[^{}]*\{[^}]*\})*)\}/g)]
    .map(match => match[1]);
  assert.ok(
    mobileBlocks.some(block => /\.atlas-back--mobile\{[^}]*display:inline-flex/.test(block)),
    "el enlace móvil debe hacerse visible dentro del @media (max-width:780px)"
  );

  // Fuera del media query queda oculto, así que en escritorio no hay duplicado.
  const outsideMedia = css.replace(/@media \([^{]*\{(?:[^{}]*\{[^}]*\})*[^{}]*\}/g, "");
  assert.match(
    outsideMedia, /\.atlas-back--mobile\{display:none\}/,
    "en escritorio el enlace móvil debe estar oculto para no duplicar «Explora»"
  );

  // Y la regla display:none tiene que ir antes del media query: misma
  // especificidad, gana la última declarada.
  const noneAt = css.indexOf(".atlas-back--mobile{display:none}");
  const showAt = css.indexOf(".atlas-back--mobile{display:inline-flex");
  assert.ok(noneAt !== -1 && showAt !== -1 && noneAt < showAt,
    "display:none debe declararse antes de la regla del @media, o la pisa");
});

// --- Regresión de la rueda sobre .side-card -------------------------------
// El arreglo tiene dos mitades que se sostienen la una a la otra: el CSS que
// hace la tarjeta receptiva y el nav.js que le corta la propagación. Cualquiera
// de las dos se podía borrar sin que ningún test se enterara.

const css = () => readFileSync(join(UNIVERSE, "styles.css"), "utf8");
const sinComentarios = text => text.replace(/\/\*[\s\S]*?\*\//g, "");

test(".side-card conserva pointer-events:auto", () => {
  // .hud es pointer-events:none. Sin este auto la tarjeta no recibe la rueda y
  // el final de las fichas que desbordan (41px en earth.html a 1366x768, 125px
  // en ton-618.html) vuelve a quedar inalcanzable.
  // El selector se ancla a un separador para no confundirlo con .side-card h1{…}
  // ni con un sufijo de otra clase.
  const bloques = [...sinComentarios(css()).matchAll(/(?:^|[};\n,])\.side-card\{([^}]*)\}/g)]
    .map(match => match[1]);
  assert.ok(bloques.length > 0, "no encuentro la regla .side-card en styles.css");
  assert.ok(
    bloques.some(bloque => /pointer-events:\s*auto/.test(bloque)),
    ".side-card debe declarar pointer-events:auto para revertir el pointer-events:none de .hud"
  );
  assert.ok(
    bloques.some(bloque => /overflow:\s*auto/.test(bloque)),
    ".side-card debe seguir con overflow:auto: es lo que hay que poder desplazar"
  );
});

test(".siblings .btn tiene una regla :focus-visible", () => {
  // Los hermanos los inyecta nav.js, así que no heredan el foco de ningún
  // componente de la página: si se cae esta regla, se navegan a ciegas.
  assert.match(
    sinComentarios(css()), /\.siblings \.btn:focus-visible\{[^}]*outline:[^}]*\}/,
    "los botones de hermanos necesitan su propio :focus-visible con outline"
  );
});

test("nav.js corta wheel y pointerdown en .side-card", () => {
  const nav = readFileSync(join(UNIVERSE, "nav.js"), "utf8");
  assert.match(nav, /querySelector\("\.side-card"\)/,
    "nav.js tiene que localizar la tarjeta para aislarla");

  for (const evento of ["wheel", "pointerdown"]) {
    const listener = new RegExp(
      `addEventListener\\("${evento}",[\\s\\S]{0,240}?stopPropagation\\(\\)`
    );
    assert.match(nav, listener,
      `nav.js debe detener la propagación de ${evento} sobre la tarjeta: ` +
      "los manejadores de la escena escuchan en window en fase de burbujeo"
    );
  }
});

// Los guardas por destino vivían dentro de la escena 3D, que el plan declaraba
// intocable, y dejaban sin zoom todo lo que no fuera el canvas: en index.html
// eso era .timeline-wrap, que ocupa el 46% del viewport a 1366x768 y no
// desplaza nada, así que la rueda ahí no hacía absolutamente nada.
const SIN_GUARDA = ["main.js", "solar-scale.js", "universe-body.js"];

test("la escena 3D no filtra la rueda ni el pointerdown por destino", () => {
  for (const archivo of SIN_GUARDA) {
    const source = readFileSync(join(UNIVERSE, archivo), "utf8");
    assert.doesNotMatch(
      source, /\.target\s*!==\s*renderer\.domElement/,
      `${archivo} vuelve a llevar el guarda e.target !== renderer.domElement: ` +
      "aislar la tarjeta es cosa de nav.js, no de la escena"
    );
  }
});

test("ninguna página duplica el CSS de .atlas-back en línea", () => {
  const pages = readdirSync(UNIVERSE).filter(name => name.endsWith(".html"));
  for (const page of pages) {
    const html = readFileSync(join(UNIVERSE, page), "utf8");
    assert.doesNotMatch(html, /\.atlas-back\{/, `${page} todavía lleva el CSS en línea`);
  }
});

test("el shader estelar solo se usa en las fichas, no en la vista amplia", () => {
  // 108 estrellas con shader propio en la vista del universo serían 108 programas
  // compilados para cuerpos de pocos píxeles. El código debe elegir según `detail`.
  const src = readFileSync(join(UNIVERSE, "star-renderer.js"), "utf8");
  assert.match(src, /detail\s*\?\s*starSurfaceMaterial/,
    "createStarObject debe elegir el shader solo cuando detail es true");
  assert.match(src, /:\s*new THREE\.MeshBasicMaterial\(\{color:star\.color\}\)/,
    "sin detail debe quedarse con el material plano, que es el barato");
});

test("la superficie estelar emite por encima de 1", () => {
  // Con tone mapping ACES un valor de 1 se comprime a gris claro: una estrella
  // saldría como una luna. El empuje es lo que la hace brillar.
  const src = readFileSync(join(UNIVERSE, "star-renderer.js"), "utf8");
  const m = src.match(/gl_FragColor=vec4\(color\*([\d.]+),1\.0\)/);
  assert.ok(m, "falta el factor de emisión en el shader estelar");
  const factor = Number(m[1]);
  assert.ok(factor > 1.2 && factor < 2.4,
    `el factor de emisión es ${factor}: por debajo de 1,2 la estrella sale apagada y por encima de 2,4 se quema y borra la granulación`);
});
