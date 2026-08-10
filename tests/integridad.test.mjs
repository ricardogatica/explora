import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog, siblingsFor } from "../universo/cielo/nav-model.js";
import { CONSTELLATION_BY_SLUG } from "../universo/cielo/data.js";
import { baseLocal } from "../universo/cielo/universe/sky.js";

/* Todo lo del universo vive ya dentro de su aplicación, repartido en tres
   sitios según qué es cada cosa: los datos y el catálogo del cielo, los
   renderizadores de Three.js, y las escenas que los montan. Las texturas van
   aparte, en la carpeta pública, porque las sirve nginx y no las empaqueta
   nadie. */
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const CIELO = join(RAIZ, "universo/cielo");
const RENDER = join(RAIZ, "universo/render");
const ESCENAS = join(RAIZ, "universo/app/escenas");
const PUBLICO = join(RAIZ, "universo/public/universo");
const entries = buildCatalog().flatMap(group => group.entries);

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

test("cada mapa declarado por un cuerpo existe en disco", async () => {
  const { BODY_DATA } = await import("../universo/cielo/data.js");
  let declarados = 0;
  for (const [slug, body] of Object.entries(BODY_DATA)) {
    for (const [nombre, ruta] of Object.entries(body.textures ?? {})) {
      declarados++;
      /* Las rutas se declaran relativas y la aplicación les antepone /universo/
         (ver app/datos/texturas.js); en disco eso es la carpeta pública. */
      assert.ok(existsSync(join(PUBLICO, ruta)),
        `${slug}.${nombre} apunta a ${ruta}, que no existe`);
    }
  }
  assert.ok(declarados >= 16, `esperaba al menos 16 mapas declarados, hay ${declarados}`);
});

test("el Sol es el único cuerpo con material emisivo", async () => {
  const { BODY_DATA } = await import("../universo/cielo/data.js");
  const emisivos = Object.entries(BODY_DATA).filter(([, b]) => b.emissive).map(([s]) => s);
  assert.deepEqual(emisivos, ["sun"],
    "solo el Sol emite luz propia; el resto debe recibirla para que se vea el terminador");
});

test("solo tienen halo atmosférico los cuerpos con nubes", async () => {
  const { BODY_DATA } = await import("../universo/cielo/data.js");
  for (const [slug, body] of Object.entries(BODY_DATA)) {
    if (!body.atmosphere) continue;
    assert.ok(body.textures?.clouds,
      `${slug} declara atmósfera pero no tiene mapa de nubes: el halo quedaría flotando sobre una superficie desnuda`);
  }
});

test("las lunas interiores orbitan más rápido que las exteriores", async () => {
  // Tercera ley de Kepler. Los números están escritos a mano, así que conviene
  // que algo vigile que nadie los desordene al añadir una luna.
  const { BODY_DATA } = await import("../universo/cielo/data.js");
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
  const { BODY_DATA } = await import("../universo/cielo/data.js");
  const RING_OUTER = 2.27;   // igual que RING_OUTER_SCALE en body-renderer.js
  for (const [slug, body] of Object.entries(BODY_DATA)) {
    const limite = body.textures?.ring ? body.radius * RING_OUTER : body.radius;
    for (const luna of body.satellites ?? []) {
      assert.ok(luna.orbitRadius - luna.radius > limite,
        `en ${slug}, ${luna.name} orbitaría por dentro de ${body.textures?.ring ? "los anillos" : "el planeta"}`);
    }
  }
});

/* ── La rueda y la pulsación sobre el lienzo ───────────────────────────────
   Dos guardas que parecen la misma y no lo son. Vienen del sitio anterior y
   siguen valiendo aquí, porque las escenas son las mismas.

   La RUEDA no se filtra por destino: hacerlo dejaba sin zoom todo lo que
   quedara bajo el HUD, que en la vista del universo es casi la mitad de la
   pantalla —la franja temporal sola ocupa 380 píxeles y no desplaza nada—.

   El POINTERDOWN sí se filtra, y por un motivo que la rueda no tiene: desde que
   la ficha se abre al acertar un cuerpo y se cierra al fallar, un raycast
   lanzado al pulsar un botón del panel cerraba la ficha que ese mismo botón
   acababa de abrir. */

const SIN_GUARDA_DE_RUEDA = ["universo.js", "escala-planetaria.js", "objeto-celeste.js"];

/* Las escenas registran manejadores con nombre —`renderer.domElement
   .addEventListener("wheel", alGirarRueda)`—, así que hay que ir a buscar el
   cuerpo de la función y no leer lo que venga detrás del registro. Mirando
   detrás se leía el bloque de la pulsación, que sí lleva el filtro, y el test
   daba por filtrada una rueda que no lo estaba. */
function cuerpoDelManejador(fuente, evento) {
  const registro = fuente.match(new RegExp(`addEventListener\\("${evento}",\\s*(\\w+)`));
  if (!registro) return null;
  const definicion = fuente.indexOf(`const ${registro[1]} =`);
  return definicion === -1 ? null : fuente.slice(definicion, definicion + 320);
}

test("la escena 3D no filtra la rueda por destino", () => {
  for (const archivo of SIN_GUARDA_DE_RUEDA) {
    const cuerpo = cuerpoDelManejador(readFileSync(join(ESCENAS, archivo), "utf8"), "wheel");
    assert.ok(cuerpo, `${archivo} debería seguir escuchando la rueda`);
    assert.doesNotMatch(
      cuerpo, /\.target\s*!==\s*renderer\.domElement/,
      `${archivo} vuelve a filtrar la RUEDA por destino: eso deja sin zoom ` +
      "todo lo que quede bajo el HUD, que es casi la mitad de la pantalla"
    );
  }
});

const CON_GUARDA_DE_PULSACION = ["universo.js", "escala-planetaria.js", "escala-de-soles.js"];

test("elegir un cuerpo solo cuenta si la pulsación cae en el lienzo", () => {
  for (const archivo of CON_GUARDA_DE_PULSACION) {
    const cuerpo = cuerpoDelManejador(readFileSync(join(ESCENAS, archivo), "utf8"), "pointerdown");
    assert.ok(cuerpo, `${archivo} debería escuchar pointerdown`);
    assert.match(
      cuerpo, /\.target\s*!==\s*renderer\.domElement\)\s*return/,
      `${archivo} tiene que descartar las pulsaciones que no caen en el lienzo`
    );
  }
});

test("el shader estelar solo se usa en las fichas, no en la vista amplia", () => {
  // 108 estrellas con shader propio en la vista del universo serían 108 programas
  // compilados para cuerpos de pocos píxeles. El código debe elegir según `detail`.
  const src = readFileSync(join(RENDER, "star-renderer.js"), "utf8");
  assert.match(src, /detail\s*\?\s*starSurfaceMaterial/,
    "createStarObject debe elegir el shader solo cuando detail es true");
  assert.match(src, /:\s*new THREE\.MeshBasicMaterial\(\{color:star\.color\}\)/,
    "sin detail debe quedarse con el material plano, que es el barato");
});

test("la superficie estelar emite por encima de 1", () => {
  // Con tone mapping ACES un valor de 1 se comprime a gris claro: una estrella
  // saldría como una luna. El empuje es lo que la hace brillar.
  const src = readFileSync(join(RENDER, "star-renderer.js"), "utf8");
  const m = src.match(/gl_FragColor=vec4\(color\*([\d.]+),1\.0\)/);
  assert.ok(m, "falta el factor de emisión en el shader estelar");
  const factor = Number(m[1]);
  assert.ok(factor > 1.2 && factor < 2.4,
    `el factor de emisión es ${factor}: por debajo de 1,2 la estrella sale apagada y por encima de 2,4 se quema y borra la granulación`);
});

test("el catálogo del cielo trae datos medidos, no inventados", async () => {
  const { KNOWN_STARS } = await import("../universo/cielo/universe/stars.js");
  const { CONSTELLATIONS } = await import("../universo/cielo/universe/constellations.js");

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
  const { KNOWN_STAR_BY_SLUG } = await import("../universo/cielo/universe/stars.js");
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
  const archivos = [
    ...readdirSync(ESCENAS).filter(n => n.endsWith(".js")).map(n => join(ESCENAS, n)),
    ...readdirSync(RENDER).filter(n => n.endsWith(".js")).map(n => join(RENDER, n))
  ];
  let revisados = 0;
  for (const archivo of archivos) {
    const lineas = readFileSync(archivo, "utf8").split("\n");
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
          `${basename(archivo)}:${indice + 1} gira una cantidad fija por cuadro, así que su ` +
          `velocidad depende del refresco de la pantalla:\n    ${sentencia.trim()}`);
      }
    });
  }
  assert.ok(revisados >= 20, `esperaba al menos 20 giros que revisar, hubo ${revisados}`);
});

test("las escenas 3D miden el tiempo con el reloj compartido", () => {
  // Un reloj propio por escena es como se colaron los dos primeros defectos.
  /* Una escena es la que se monta: exporta un `montarAlgo`. En la carpeta hay
     también piezas que usa una escena —los cuerpos menores del sistema solar—
     que no llevan reloj propio porque el suyo se lo pasa quien las monta.
     Contar archivos a secas hacía fallar esta prueba al añadir una pieza. */
  const escenas = readdirSync(ESCENAS)
    .filter(nombre => nombre.endsWith(".js"))
    .filter(nombre => /export function montar/.test(readFileSync(join(ESCENAS, nombre), "utf8")));
  /* Un suelo y no una igualdad: añadir una escena es legítimo y no debe romper
     esta prueba. Lo que se comprueba es que TODAS usen el reloj compartido; el
     suelo solo protege de que el filtro deje de encontrar archivos y el bucle
     pase en vacío. */
  assert.ok(escenas.length >= 6, `esperaba al menos seis escenas montables, hay ${escenas.length}`);
  for (const escena of escenas) {
    const source = readFileSync(join(ESCENAS, escena), "utf8");
    assert.match(source, /from "@explora\/compartido\/tiempo\.js"/,
      `${escena} debe usar el reloj compartido`);
    assert.match(source, /reloj\.paso\(/, `${escena} debe pedirle el intervalo al reloj`);
  }
});

test("la Luna no está en la fila de la escala planetaria", () => {
  // Estaba entre la Tierra y Marte como si fuera un planeta más. Ahora orbita
  // a la Tierra: cuelga de un pivote dentro del grupo de la Tierra.
  const source = readFileSync(join(ESCENAS, "escala-planetaria.js"), "utf8");
  const fila = source.match(/const FILA = \[[\s\S]*?\];/);
  assert.ok(fila, "no se encontró la fila de cuerpos de la escala planetaria");
  assert.doesNotMatch(fila[0], /slug: ?"moon"/,
    "la Luna no es un planeta: no va en la fila que compara planetas");
  assert.match(source, /objetos\.earth\.grupo\.add\(pivoteLuna\)/,
    "la Luna tiene que orbitar dentro del grupo de la Tierra");
});

test("el proyecto declara sus licencias y las de lo que redistribuye", () => {
  /* No es burocracia: el catálogo del cielo es obra derivada bajo CC BY-SA 4.0 y
     las texturas son CC BY 4.0. Redistribuirlas sin decirlo incumple sus
     licencias, y es el tipo de deuda que no avisa hasta que alguien reclama. */
  const raiz = RAIZ;
  for (const archivo of ["LICENSE", "LICENSE-CONTENIDO", "README.md"]) {
    assert.ok(existsSync(join(raiz, archivo)), `falta ${archivo} en la raíz`);
  }
  const contenido = readFileSync(join(raiz, "LICENSE-CONTENIDO"), "utf8");
  for (const fuente of ["CC BY-SA 4.0", "HYG", "Stellarium", "Solar System Scope", "CC BY 4.0"]) {
    assert.ok(contenido.includes(fuente), `LICENSE-CONTENIDO no menciona ${fuente}`);
  }
  assert.match(readFileSync(join(raiz, "LICENSE"), "utf8"), /MIT License/);

  // De que la atribución siga a la vista se ocupa «la atribución sigue visible
  // en el universo nuevo», que lee la página de referencias de la aplicación.
});

test("lo que el universo importa del paquete compartido existe", () => {
  // Un prefijo bien declarado que apunta a un archivo que no está da un 404 y
  // una página en blanco.
  const compartido = join(RAIZ, "compartido");
  const fuentes = [ESCENAS, RENDER, CIELO].flatMap(carpeta =>
    readdirSync(carpeta).filter(n => n.endsWith(".js")).map(n => join(carpeta, n)));
  for (const nombre of fuentes) {
    const fuente = readFileSync(nombre, "utf8");
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
    readFileSync(join(RAIZ, "universo/app/datos/referencias.json"), "utf8")
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
    await import("../universo/cielo/universe/sky.js");

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
