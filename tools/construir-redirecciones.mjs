/* Genera el mapa de redirecciones de las URL viejas a las nuevas.

   El sitio anterior era un HTML por página dentro de sistema_solar/: earth.html,
   vega.html, constellations.html. Esas URL están escritas en marcadores y en el
   índice de los buscadores, y romperlas es tirar a la basura lo único que no se
   puede reconstruir de un sitio: los enlaces que ya apuntan a él.

   El mapa se genera del catálogo y no se escribe a mano porque el catálogo sabe
   a qué grupo pertenece cada slug —cuerpo, estrella, galaxia— y esa es
   justamente la parte que se equivoca uno escribiendo a mano.

   Uso: node tools/construir-redirecciones.mjs > infra/redirecciones.conf */
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildCatalog } from "../sistema_solar/nav-model.js";
import { rutaDeEntrada } from "../universo/app/datos/rutas.js";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PREFIJO = "/universo";

/* Las páginas que no son fichas: vistas y páginas sueltas. `star.html` no está
   aquí porque llevaba el slug en la query y se resuelve aparte, en nginx. */
const PAGINAS = {
  "index.html": "/",
  "indice.html": "/indice",
  "referencias.html": "/referencias",
  "solar-scale.html": "/escala-planetaria",
  "star-scale.html": "/escala-de-soles",
  "constellations.html": "/constelaciones",
  // La prueba de la Tierra fotorrealista terminó siendo la ficha de la Tierra.
  "tierra_threejs_ultra.html": "/cuerpos/earth"
};

/* Cada slug del catálogo, con el grupo que le corresponde. */
export function destinosDeFicha() {
  const destinos = {};
  for (const grupo of buildCatalog()) {
    for (const entrada of grupo.entries) {
      destinos[`${entrada.slug}.html`] = rutaDeEntrada(grupo.id, entrada.slug);
    }
  }
  return destinos;
}

/* Solo las páginas que existían: el catálogo tiene 400 estrellas y solo unas
   pocas tenían HTML propio. Redirigir lo que nunca existió es ruido. */
export function redirecciones() {
  const heredadas = new Set(readdirSync(join(RAIZ, "sistema_solar")).filter(n => n.endsWith(".html")));
  const fichas = destinosDeFicha();
  const mapa = {};
  for (const archivo of [...heredadas].sort()) {
    if (archivo === "star.html") continue;          // lleva el slug en la query
    const destino = PAGINAS[archivo] ?? fichas[archivo];
    if (destino) mapa[`/sistema_solar/${archivo}`] = PREFIJO + destino;
  }
  return mapa;
}

/* Las que quedan sin destino: si aparece alguna, es que hay una página que el
   catálogo no conoce y habría que decidir a dónde va. */
export function sinDestino() {
  const heredadas = readdirSync(join(RAIZ, "sistema_solar")).filter(n => n.endsWith(".html"));
  const fichas = destinosDeFicha();
  return heredadas.filter(n => n !== "star.html" && !PAGINAS[n] && !fichas[n]).sort();
}

function comoNginx() {
  const mapa = redirecciones();
  const ancho = Math.max(...Object.keys(mapa).map(k => k.length));
  const lineas = Object.entries(mapa).map(([de, a]) => `  ${de.padEnd(ancho)}  ${a};`);
  return [
    "# Generado por tools/construir-redirecciones.mjs. No editar a mano.",
    "#",
    "# Las URL del sitio anterior, cada una a su página nueva. El valor vacío por",
    "# defecto es lo que distingue «hay que redirigir» de «no es una URL vieja».",
    "map $uri $destino_heredado {",
    "  default \"\";",
    ...lineas,
    "}"
  ].join("\n") + "\n";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const huerfanas = sinDestino();
  if (huerfanas.length) console.error(`Aviso: sin destino conocido: ${huerfanas.join(", ")}`);
  process.stdout.write(comoNginx());
}
