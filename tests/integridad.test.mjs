import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog, siblingsFor } from "../sistema_solar/nav-model.js";
import { KNOWN_STAR_BY_SLUG, CONSTELLATION_BY_SLUG } from "../sistema_solar/data.js";
import { baseLocal } from "../sistema_solar/universe/sky.js";

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

// El guarda por destino en la RUEDA dejaba sin zoom todo lo que no fuera el
// canvas: en index.html eso era .timeline-wrap, que ocupa el 46% del viewport a
// 1366x768 y no desplaza nada, así que la rueda ahí no hacía absolutamente nada.
// Sigue prohibido. El de pointerdown es otra cosa y se comprueba justo debajo.
const SIN_GUARDA = ["main.js", "solar-scale.js", "universe-body.js"];

test("la escena 3D no filtra la rueda por destino", () => {
  for (const archivo of SIN_GUARDA) {
    const source = readFileSync(join(UNIVERSE, archivo), "utf8");
    const wheel = source.match(/addEventListener\("wheel",[\s\S]{0,320}/);
    assert.ok(wheel, `${archivo} debería seguir escuchando la rueda`);
    assert.doesNotMatch(
      wheel[0], /\.target\s*!==\s*renderer\.domElement/,
      `${archivo} vuelve a filtrar la RUEDA por destino: eso deja sin zoom ` +
      "todo lo que quede bajo el HUD, que es casi la mitad de la pantalla"
    );
  }
});

// El pointerdown sí se filtra, y por un motivo que la rueda no tiene: desde que
// la ficha del cuerpo se abre al acertar y se cierra al fallar, un raycast
// lanzado por pulsar un botón del panel cerraba la ficha que ese mismo botón
// acababa de abrir. nav.js no puede resolverlo solo: aísla .side-card, y
// index.html no tiene ninguna.
const CON_GUARDA_POINTERDOWN = ["main.js", "solar-scale.js", "star-scale.js"];

test("elegir un cuerpo solo cuenta si la pulsación cae en el lienzo", () => {
  for (const archivo of CON_GUARDA_POINTERDOWN) {
    const source = readFileSync(join(UNIVERSE, archivo), "utf8");
    const pointerdown = source.match(/addEventListener\("pointerdown",[\s\S]{0,200}/);
    assert.ok(pointerdown, `${archivo} debería escuchar pointerdown`);
    assert.match(
      pointerdown[0], /\.target\s*!==\s*renderer\.domElement\)\s*return/,
      `${archivo} tiene que descartar las pulsaciones que no caen en el lienzo`
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

test("el catálogo del cielo trae datos medidos, no inventados", async () => {
  const { KNOWN_STARS } = await import("../sistema_solar/universe/stars.js");
  const { CONSTELLATIONS } = await import("../sistema_solar/universe/constellations.js");

  assert.ok(KNOWN_STARS.length > 700, `esperaba más de 700 estrellas, hay ${KNOWN_STARS.length}`);
  assert.equal(CONSTELLATIONS.length, 88);

  /* El defecto que esto vino a arreglar: todas las estrellas de una
     constelación compartían su coordenada. Si vuelve, dos estrellas de Orión
     tendrían la misma ascensión recta. */
  const orion = CONSTELLATIONS.find(c => c.slug === "orion");
  const ras = new Set(orion.points.map(p => p.starSlug));
  assert.ok(orion.points.length > 10, `Orión debería trazar más de 10 estrellas, traza ${orion.points.length}`);
  assert.equal(ras.size, orion.points.length, "Orión no puede repetir estrellas en su figura");

  const posiciones = new Set(orion.points.map(p => `${p.x},${p.y}`));
  assert.equal(posiciones.size, orion.points.length,
    "cada estrella de la figura debe caer en un punto distinto");

  // Las líneas solo pueden unir estrellas que estén en la figura.
  const enFigura = new Set(orion.points.map(p => p.id));
  for (const [a, b] of orion.lines) {
    assert.ok(enFigura.has(a) && enFigura.has(b), `la línea ${a}-${b} apunta fuera de la figura`);
  }
});

test("las estrellas conocidas conservan su ficha y sus datos reales", async () => {
  const { KNOWN_STAR_BY_SLUG } = await import("../sistema_solar/universe/stars.js");
  // Sus slugs y sus páginas HTML existían antes del catálogo: no pueden cambiar.
  for (const slug of ["sirius", "vega", "betelgeuse", "rigel", "polaris", "antares", "acrux", "proxima-centauri", "ton-618"]) {
    const s = KNOWN_STAR_BY_SLUG[slug];
    assert.ok(s, `falta ${slug}`);
    assert.ok(!s.file.includes("?"), `${slug} debería tener archivo propio, tiene ${s.file}`);
  }
  // Y sus números ahora son los medidos.
  assert.equal(KNOWN_STAR_BY_SLUG.rigel.type, "Supergigante azul-blanca");
  assert.equal(KNOWN_STAR_BY_SLUG.betelgeuse.type, "Supergigante roja");
  assert.ok(Math.abs(KNOWN_STAR_BY_SLUG.sirius.distanceLy - 8.6) < 0.2);
});

test("el norte del cielo apunta al norte", () => {
  /* La base local de una figura se armaba con center × east, que apunta al SUR:
     todas las constelaciones se dibujaban boca abajo. Con cuatro puntos
     inventados por figura era invisible; con las figuras reales, la Cruz del Sur
     salía con Acrux arriba en vez de abajo.

     La comprobación es la definición de norte: avanzar un poco hacia el norte
     desde un punto del cielo tiene que aumentar la declinación. Se prueba en los
     dos hemisferios y a varias ascensiones rectas, porque un signo equivocado en
     el producto vectorial puede acertar por casualidad en un solo punto. */
  const puntos = [[0, 0], [6, 30], [12.4, -60.3], [18, -20], [5.6, 7.4], [23.5, 75]];
  for (const [ra, dec] of puntos) {
    const { center, north } = baseLocal(ra, dec);
    const avanzado = center.map((valor, i) => valor + north[i] * 0.02);
    const modulo = Math.hypot(...avanzado);
    const decAvanzada = Math.asin(avanzado[1] / modulo) * 180 / Math.PI;
    assert.ok(
      decAvanzada > dec + 0.5,
      `en ra ${ra}h dec ${dec}°, ir hacia el norte lleva a dec ${decAvanzada.toFixed(2)}°: ` +
      "el vector apunta al sur y la figura sale boca abajo"
    );
  }
});

test("las figuras se dibujan con la misma orientación que tienen en el cielo", () => {
  // Dos casos que cualquiera puede comprobar mirando al cielo: en la Cruz del
  // Sur, Gacrux queda al norte de Acrux; en Orión, Betelgeuse por encima de
  // Rigel. Se recorre el mismo camino que la vista: proyectar y volver a pegar.
  const ESCALA = 0.032;
  const alturaDibujada = (figura, slug) => {
    const punto = figura.points.find(p => p.starSlug === slug);
    const { center, east, north } = baseLocal(figura.ra, figura.dec);
    return center.map((valor, i) => valor + east[i] * punto.x * ESCALA + north[i] * punto.y * ESCALA)[1];
  };
  const casos = [
    ["crux", "gacrux", "acrux"],
    ["orion", "betelgeuse", "rigel"],
    ["orion", "bellatrix", "saiph"]
  ];
  for (const [slug, arriba, abajo] of casos) {
    const figura = CONSTELLATION_BY_SLUG[slug];
    assert.ok(
      alturaDibujada(figura, arriba) > alturaDibujada(figura, abajo),
      `en ${figura.name}, ${arriba} debe dibujarse por encima de ${abajo}`
    );
  }
});

test("nada de lo que gira lo hace por cuadro", () => {
  /* Sumar un incremento fijo en cada cuadro ata la velocidad al refresco de la
     pantalla. Medido en el navegador de pruebas, que va a 122 cuadros por
     segundo: el Sol de la escala de soles daba la vuelta en 17 segundos en vez de
     los 34 previstos y la Luna orbitaba en 20 en vez de 40; en un monitor de
     60 Hz el módulo entero iba a la mitad de velocidad que en uno de 120.

     Cada giro tiene que llevar como factor uno de los tres nombres del tiempo
     transcurrido: `avance` (cuadros de referencia, ver tiempo.js), `segundos` o
     `dt`. El barrido cubre los archivos que existan, no una lista escrita a mano,
     así que una escena nueva que gire por cuadro también lo rompe. */
  const FACTORES = /\bavance\b|\bsegundos\b|\bdt\b/;
  const archivos = readdirSync(UNIVERSE).filter(nombre => nombre.endsWith(".js"));
  let revisados = 0;
  for (const archivo of archivos) {
    const lineas = readFileSync(join(UNIVERSE, archivo), "utf8").split("\n");
    lineas.forEach((linea, indice) => {
      if (linea.trimStart().startsWith("//") || linea.trimStart().startsWith("*")) return;
      /* Por sentencia y no por línea: main.js encadena veinte sentencias en una
         sola, así que mirar la línea entera dejaba pasar un giro por cuadro
         mientras cualquier otra sentencia de la misma línea llevara el factor.
         Se comprobó quitándole el factor a los anillos de Saturno: el test pasaba. */
      for (const sentencia of linea.split(";")) {
        if (!/rotation\.[xyz]\s*[+-]=/.test(sentencia)) continue;
        revisados++;
        assert.match(sentencia, FACTORES,
          `${archivo}:${indice + 1} gira una cantidad fija por cuadro, así que su ` +
          `velocidad depende del refresco de la pantalla:\n    ${sentencia.trim()}`);
      }
    });
  }
  assert.ok(revisados >= 20, `esperaba al menos 20 giros que revisar, hubo ${revisados}`);
});

test("las escenas 3D miden el tiempo con el reloj compartido", () => {
  // Un reloj propio por escena es como se colaron los dos primeros defectos.
  const escenas = ["main.js", "body.js", "solar-scale.js", "star-scale.js", "universe-body.js", "constellations-view.js"];
  for (const escena of escenas) {
    const source = readFileSync(join(UNIVERSE, escena), "utf8");
    assert.match(source, /from "@explora\/compartido\/tiempo\.js"/,
      `${escena} debe usar el reloj compartido`);
    assert.match(source, /reloj\.paso\(/, `${escena} debe pedirle el intervalo al reloj`);
  }
});

test("la Luna no está en la fila de la escala planetaria", () => {
  // Estaba entre la Tierra y Marte como si fuera un planeta más. Ahora orbita
  // a la Tierra: cuelga de un pivote dentro del grupo de la Tierra.
  const source = readFileSync(join(UNIVERSE, "solar-scale.js"), "utf8");
  const fila = source.match(/const layout=\[[\s\S]*?\];/);
  assert.ok(fila, "no se encontró la fila de cuerpos de la escala planetaria");
  assert.doesNotMatch(fila[0], /slug:"moon"/,
    "la Luna no es un planeta: no va en la fila que compara planetas");
  assert.match(source, /objects\.earth\.group\.add\(pivoteLuna\)/,
    "la Luna tiene que orbitar dentro del grupo de la Tierra");
});

test("el proyecto declara sus licencias y las de lo que redistribuye", () => {
  /* No es burocracia: el catálogo del cielo es obra derivada bajo CC BY-SA 4.0 y
     las texturas son CC BY 4.0. Redistribuirlas sin decirlo incumple sus
     licencias, y es el tipo de deuda que no avisa hasta que alguien reclama. */
  const raiz = join(UNIVERSE, "..");
  for (const archivo of ["LICENSE", "LICENSE-CONTENIDO", "README.md"]) {
    assert.ok(existsSync(join(raiz, archivo)), `falta ${archivo} en la raíz`);
  }
  const contenido = readFileSync(join(raiz, "LICENSE-CONTENIDO"), "utf8");
  for (const fuente of ["CC BY-SA 4.0", "HYG", "Stellarium", "Solar System Scope", "CC BY 4.0"]) {
    assert.ok(contenido.includes(fuente), `LICENSE-CONTENIDO no menciona ${fuente}`);
  }
  assert.match(readFileSync(join(raiz, "LICENSE"), "utf8"), /MIT License/);

  // La atribución tiene que seguir siendo visible, no solo estar en un archivo
  // que nadie abre: es lo que exigen las dos licencias.
  const referencias = readFileSync(join(UNIVERSE, "referencias.html"), "utf8");
  assert.ok(referencias.includes("CC BY-SA 4.0") && referencias.includes("Solar System Scope"),
    "referencias.html es la atribución visible y tiene que nombrar las fuentes");
});

test("el universo puede resolver el paquete compartido", () => {
  /* El reloj y el andamiaje 3D viven en compartido/, que las dos aplicaciones
     comparten. En materias lo resuelve el empaquetador; en el universo, que no
     tiene build, lo resuelve el importmap de cada HTML. Si un módulo importa
     «@explora/compartido/…» y su página no declara el prefijo, la página se cae
     entera con un error de resolución. Y eso no lo ve `node --test`: aquí los
     módulos de escena ni siquiera se cargan, porque necesitan DOM. */
  const modulos = readdirSync(UNIVERSE).filter(nombre => nombre.endsWith(".js"));
  const importadores = modulos.filter(nombre =>
    readFileSync(join(UNIVERSE, nombre), "utf8").includes("@explora/compartido/")
  );
  assert.ok(importadores.length >= 6,
    `esperaba al menos 6 módulos usando el paquete compartido, hay ${importadores.length}`);

  const paginas = readdirSync(UNIVERSE).filter(nombre => nombre.endsWith(".html"));
  for (const pagina of paginas) {
    const html = readFileSync(join(UNIVERSE, pagina), "utf8");
    if (!html.includes('"three"')) continue;   // páginas sin escena 3D
    assert.match(
      html, /"@explora\/compartido\/"\s*:\s*"\.\.\/compartido\/"/,
      `${pagina} carga módulos 3D pero su importmap no sabe resolver @explora/compartido/`
    );
  }
});

test("lo que el universo importa del paquete compartido existe", () => {
  // Un prefijo bien declarado que apunta a un archivo que no está da un 404 y
  // una página en blanco.
  const compartido = join(UNIVERSE, "..", "compartido");
  for (const nombre of readdirSync(UNIVERSE).filter(n => n.endsWith(".js"))) {
    const fuente = readFileSync(join(UNIVERSE, nombre), "utf8");
    for (const [, archivo] of fuente.matchAll(/@explora\/compartido\/([\w.-]+)/g)) {
      assert.ok(existsSync(join(compartido, archivo)),
        `${nombre} importa compartido/${archivo}, que no existe`);
    }
  }
});

test("el universo prerenderiza una ruta por ficha del catálogo", async () => {
  /* Era la razón de peso para traer un framework aquí: hoy 400 estrellas
     comparten star.html?slug=… —un archivo, ninguna URL propia, invisibles para
     un buscador—. La lista de rutas se calcula del catálogo y no se escribe a
     mano: son 415 fichas y mantener una lista al día es imposible. */
  const { rutasParaPrerenderizar, rutaDeEntrada } = await import("../universo/app/datos/rutas.js");
  const rutas = rutasParaPrerenderizar();
  const entradas = buildCatalog().flatMap(grupo => grupo.entries);

  assert.ok(rutas.length >= entradas.length,
    `hay ${entradas.length} fichas y solo ${rutas.length} rutas`);
  for (const grupo of buildCatalog()) {
    for (const entrada of grupo.entries) {
      const esperada = rutaDeEntrada(grupo.id, entrada.slug);
      assert.ok(rutas.includes(esperada), `falta la ruta ${esperada}`);
    }
  }
  // Ninguna ruta con .html ni con query: son las URL que verá la gente.
  for (const ruta of rutas) {
    assert.doesNotMatch(ruta, /\.html|\?/, `${ruta} conserva la forma vieja de URL`);
  }
});

test("la atribución sigue visible en el universo nuevo", async () => {
  /* Obligación de las licencias, no cortesía: el catálogo del cielo es CC BY-SA
     y las texturas CC BY. Al migrar la página es justo cuando se pierde. */
  const referencias = JSON.parse(
    readFileSync(join(UNIVERSE, "..", "universo", "app", "datos", "referencias.json"), "utf8")
  );
  const texto = JSON.stringify(referencias);
  for (const fuente of ["CC BY-SA 4.0", "HYG", "Stellarium", "Solar System Scope"]) {
    assert.ok(texto.includes(fuente), `la página de referencias ya no menciona ${fuente}`);
  }
  assert.ok(referencias.tarjetas.length >= 12,
    `esperaba al menos 12 fichas de referencia, hay ${referencias.tarjetas.length}`);
});

test("la Vía Láctea se coloca donde está, no sobre el ecuador celeste", async () => {
  /* Las texturas de la Vía Láctea vienen en proyección galáctica: la banda recta
     por el medio de la imagen. Pegarla sin girar la deja sobre el ecuador
     celeste, y el plano galáctico llega a ±63° de declinación. Una textura
     realista en el sitio equivocado engaña más que una banda dibujada a mano.

     Se comprueba que la base lleva el marco de la textura al del cielo: su eje X
     al centro galáctico y su eje Y al polo norte galáctico. */
  const { baseGalactica, direccionDesdeRaDec, CENTRO_GALACTICO, POLO_NORTE_GALACTICO } =
    await import("../sistema_solar/universe/sky.js");

  const base = baseGalactica();
  const angulo = (a, b) => Math.acos(
    Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  ) * 180 / Math.PI;

  const centro = direccionDesdeRaDec(CENTRO_GALACTICO.ra, CENTRO_GALACTICO.dec);
  const polo = direccionDesdeRaDec(POLO_NORTE_GALACTICO.ra, POLO_NORTE_GALACTICO.dec);
  assert.ok(angulo(base.x, centro) < 0.05, `el eje X se desvía ${angulo(base.x, centro).toFixed(3)}° del centro galáctico`);
  assert.ok(angulo(base.y, polo) < 0.05, `el eje Y se desvía ${angulo(base.y, polo).toFixed(3)}° del polo galáctico`);

  // Y que sea una base de verdad: perpendicular y unitaria, o deformaría la textura.
  const norma = v => Math.hypot(...v);
  for (const [nombre, eje] of Object.entries(base)) {
    assert.ok(Math.abs(norma(eje) - 1) < 1e-6, `el eje ${nombre} no es unitario`);
  }
  const perpendicular = (a, b) => Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2]);
  assert.ok(perpendicular(base.x, base.y) < 1e-6, "los ejes X e Y no son perpendiculares");
  assert.ok(perpendicular(base.y, base.z) < 1e-6, "los ejes Y y Z no son perpendiculares");

  /* Y la comprobación que de verdad importa: el plano galáctico tiene que
     alcanzar declinaciones altas. Si alguien «simplifica» la base a la
     identidad, la banda se aplana sobre el ecuador y esto lo ve. */
  let maximaDeclinacion = 0;
  for (let grados = 0; grados < 360; grados += 2) {
    const a = grados * Math.PI / 180;
    // un punto del ecuador galáctico, expresado en el marco ecuatorial
    const v = base.x.map((_, i) => base.x[i] * Math.cos(a) + base.z[i] * Math.sin(a));
    maximaDeclinacion = Math.max(maximaDeclinacion, Math.abs(Math.asin(v[1]) * 180 / Math.PI));
  }
  assert.ok(maximaDeclinacion > 60,
    `el plano galáctico solo llega a ${maximaDeclinacion.toFixed(0)}° de declinación; ` +
    "debería pasar de 60° y si no, la banda está aplanada sobre el ecuador");
});
