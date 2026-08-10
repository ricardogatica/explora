/* Genera el mapa de redirecciones de las URL viejas a las nuevas.

   El sitio anterior era un HTML por página dentro de sistema_solar/: earth.html,
   vega.html, constellations.html. Esas URL están escritas en marcadores y en el
   índice de los buscadores, y romperlas es tirar a la basura lo único que no se
   puede reconstruir de un sitio: los enlaces que ya apuntan a él.

   La carpeta ya no existe, así que qué páginas hubo es un dato histórico y se
   guarda aquí escrito. Los destinos, en cambio, se calculan del catálogo, que
   es quien sabe si un slug es cuerpo, estrella o galaxia —y esa es justamente
   la parte que se equivoca uno a mano.

   Uso: node tools/construir-redirecciones.mjs > infra/redirecciones.conf */
import { fileURLToPath } from "node:url";
import { buildCatalog } from "../universo/cielo/nav-model.js";
import { rutaDeEntrada } from "../universo/app/datos/rutas.js";

const PREFIJO = "/universo";

/* Las páginas que no eran fichas: vistas y páginas sueltas. `star.html` no está
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

/* Los slugs que tuvieron página propia. El catálogo tiene 415 fichas y solo
   estas veinte existían como archivo: redirigir lo que nunca existió es ruido. */
const FICHAS_QUE_HUBO = [
  "acrux", "antares", "betelgeuse", "earth", "jupiter", "mars", "mercury",
  "milky-way", "moon", "neptune", "polaris", "proxima-centauri", "rigel",
  "saturn", "sirius", "sun", "ton-618", "uranus", "vega", "venus"
];

/* Dónde vive hoy cada slug, según el grupo que le da el catálogo. */
export function destinosDeFicha() {
  const destinos = {};
  for (const grupo of buildCatalog()) {
    for (const entrada of grupo.entries) {
      destinos[entrada.slug] = rutaDeEntrada(grupo.id, entrada.slug);
    }
  }
  return destinos;
}

export function redirecciones() {
  const fichas = destinosDeFicha();
  const mapa = {};
  for (const [archivo, destino] of Object.entries(PAGINAS)) {
    mapa[`/sistema_solar/${archivo}`] = PREFIJO + destino;
  }
  for (const slug of FICHAS_QUE_HUBO) {
    if (fichas[slug]) mapa[`/sistema_solar/${slug}.html`] = PREFIJO + fichas[slug];
  }
  return Object.fromEntries(Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)));
}

/* Las que quedan sin destino: si aparece alguna es que el catálogo ya no conoce
   un slug que sí tuvo página, y habría que decidir a dónde va. */
export function sinDestino() {
  const fichas = destinosDeFicha();
  return FICHAS_QUE_HUBO.filter(slug => !fichas[slug]).sort();
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
