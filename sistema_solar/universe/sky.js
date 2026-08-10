/* Convierte el catálogo crudo en lo que el sitio necesita.

   Existe para que stars.js y constellations.js no se importen entre sí. Antes
   stars.js dependía de constellations.js; si además constellations.js
   necesitara los slugs de las estrellas habría un ciclo. Aquí se deriva todo
   una vez y los dos beben de la misma fuente, así que los slugs coinciden
   siempre y las líneas de las figuras nunca apuntan a una estrella que no
   existe.

   Los datos vienen de sky-catalog.js, generado de HYG y Stellarium bajo
   CC BY-SA 4.0. Ver la cabecera de ese archivo. */

import { SKY_FIGURES, SKY_STARS } from "./sky-catalog.js";

/* Ocho estrellas ya tenían ficha propia con su slug y su archivo HTML antes de
   existir el catálogo. Se respetan: cambiarlos rompería sus URLs, que están
   enlazadas desde el índice y desde las constelaciones. El catálogo aporta sus
   coordenadas y magnitudes reales; el nombre y el slug son los de siempre. */
const SLUG_HEREDADO = new Map([
  [32349, "sirius"], [91262, "vega"], [27989, "betelgeuse"], [24436, "rigel"],
  [11767, "polaris"], [80763, "antares"], [60718, "acrux"]
]);

/* Clase espectral a algo legible. La primera letra da la temperatura y los
   números romanos la clase de luminosidad: I es supergigante, III gigante y
   V enana, que es donde está el Sol. */
const POR_TEMPERATURA = {
  O: "azul", B: "azul-blanca", A: "blanca", F: "blanco-amarilla",
  G: "amarilla", K: "naranja", M: "roja"
};

export function tipoLegible(spect) {
  const color = POR_TEMPERATURA[(spect[0] || "").toUpperCase()] ?? "";

  /* La clase de luminosidad va detrás de la letra y los dígitos: en "M2Ib" es
     "Ib". No se puede buscar con \b porque entre el "2" y la "I" no hay
     frontera de palabra —ambos son caracteres de palabra— y así fallaba: Rigel
     y Betelgeuse salían como estrellas normales en vez de supergigantes.
     Se recorta la parte espectral y se lee el número romano que queda. */
  const resto = spect.replace(/^[OBAFGKMoabfgkm]\d*(?:\.\d+)?:?\s*/, "");
  const luminosidad =
    /^IV/.test(resto) ? "Subgigante" :
    /^III/.test(resto) ? "Gigante" :
    /^II/.test(resto) ? "Gigante luminosa" :
    /^I/.test(resto) ? "Supergigante" :
    "Estrella";

  return color ? `${luminosidad} ${color}` : luminosidad;
}

/* El tamaño en pantalla sale de la magnitud aparente, que es una escala
   invertida y logarítmica: cuanto menor el número, más brillante. Sirio está
   en -1,44 y las más débiles de las figuras en 6,5. */
function tamanoDesdeMagnitud(mag) {
  const t = Math.max(0, Math.min(1, (6.6 - mag) / 8.1));
  return +(2.1 + Math.pow(t, 1.7) * 5.2).toFixed(2);
}

/* Dirección en el cielo a partir de ascensión recta y declinación. Esto es lo
   que arregla el defecto de fondo: antes todas las estrellas de una
   constelación heredaban la coordenada de la constelación, así que se
   apelotonaban en un punto en vez de dibujar su figura. */
export function direccionDesdeRaDec(raHoras, decGrados) {
  const ra = raHoras / 24 * Math.PI * 2;
  const dec = decGrados * Math.PI / 180;
  return [Math.cos(dec) * Math.sin(ra), Math.sin(dec), -Math.cos(dec) * Math.cos(ra)];
}

/* Base local del cielo en un punto: hacia dónde quedan el este y el norte
   celestes mirando desde el centro de la esfera. La usa la vista de
   constelaciones para pegar cada figura proyectada sobre su trozo de cielo.

   Vive aquí, y no en la vista, por el orden del producto vectorial: es lo único
   que hay que acertar y no se ve al mirar el código. `east × center` apunta al
   norte; `center × east` apunta al sur, y con él todas las figuras salían boca
   abajo —la Cruz del Sur con Acrux arriba, Orión con Betelgeuse por debajo de
   Rigel—. Estando aquí, un test puede comprobar que avanzar hacia el norte
   aumenta la declinación, que es lo que significa «norte». */
export function baseLocal(raHoras, decGrados) {
  const center = direccionDesdeRaDec(raHoras, decGrados);
  const ra = raHoras / 24 * Math.PI * 2;
  const east = [Math.cos(ra), 0, Math.sin(ra)];
  const norte = [
    east[1] * center[2] - east[2] * center[1],
    east[2] * center[0] - east[0] * center[2],
    east[0] * center[1] - east[1] * center[0]
  ];
  const modulo = Math.hypot(...norte) || 1;
  return { center, east, north: norte.map(v => v / modulo) };
}

/* De coordenadas galácticas a ecuatoriales.

   Los panoramas de la Vía Láctea se publican casi siempre en proyección
   galáctica: la banda va recta por el medio de la imagen y el centro de la
   galaxia queda justo en el centro. Nuestro cielo, en cambio, se dibuja en
   ascensión recta y declinación, que es donde están las estrellas del catálogo.

   Pegar una de esas texturas sin girarla pone la Vía Láctea sobre el ecuador
   celeste, que es donde NO está: el plano galáctico llega a ±63° de declinación.
   Y una textura realista en el sitio equivocado engaña más que una banda
   dibujada a mano, porque parece un dato.

   La rotación se construye con dos direcciones medidas: el polo norte galáctico
   y el centro galáctico. Devuelve la matriz por columnas —los ejes X, Y y Z del
   marco galáctico expresados en el ecuatorial— para no depender de Three.js:
   este módulo no tiene dependencias y no debe adquirirlas. */
export const POLO_NORTE_GALACTICO = { ra: 12.85643, dec: 27.12825 };
export const CENTRO_GALACTICO = { ra: 17.76112, dec: -28.93617 };

export function baseGalactica() {
  const producto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const normalizar = v => { const m = Math.hypot(...v) || 1; return v.map(x => x / m); };
  const cruz = (a, b) => [
    a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]
  ];

  const y = normalizar(direccionDesdeRaDec(POLO_NORTE_GALACTICO.ra, POLO_NORTE_GALACTICO.dec));
  const centro = direccionDesdeRaDec(CENTRO_GALACTICO.ra, CENTRO_GALACTICO.dec);
  /* El centro medido y el polo medido no son exactamente perpendiculares por el
     redondeo de sus coordenadas: se ortogonaliza para que la base no deforme la
     textura. */
  const proyeccion = producto(centro, y);
  const x = normalizar(centro.map((v, i) => v - y[i] * proyeccion));
  const z = normalizar(cruz(x, y));
  return { x, y, z };
}

/* La escala radial es logarítmica en años luz: sin ella, Sirio a 8,6 y una
   supergigante a 860 no cabrían en la misma escena. */
export function radioDesdeDistancia(aniosLuz) {
  return Math.log10((aniosLuz ?? 500) + 1) * 360;
}

export const SKY = SKY_STARS.map(estrella => {
  const slug = SLUG_HEREDADO.get(estrella.hip) ?? estrella.slug;
  const propia = SLUG_HEREDADO.has(estrella.hip);
  const direccion = direccionDesdeRaDec(estrella.ra, estrella.dec);
  const radio = radioDesdeDistancia(estrella.ly);
  return {
    ...estrella,
    slug,
    // Las ocho heredadas tienen archivo propio; el resto usa la plantilla.
    file: propia ? `${slug}.html` : `star.html?slug=${slug}`,
    tieneFichaPropia: propia,
    type: tipoLegible(estrella.spect),
    size: tamanoDesdeMagnitud(estrella.mag),
    direction: direccion,
    position: direccion.map(v => v * radio)
  };
});

export const SKY_BY_HIP = new Map(SKY.map(s => [s.hip, s]));
export const SKY_BY_SLUG = new Map(SKY.map(s => [s.slug, s]));

/* Figuras con los HIP ya resueltos a estrellas. Se descarta cualquier
   referencia sin datos, así que ninguna línea queda colgando. */
export const FIGURAS = SKY_FIGURES.map(figura => ({
  abbr: figura.abbr,
  latin: figura.latin,
  lines: figura.lines
    .map(linea => linea.filter(hip => SKY_BY_HIP.has(hip)))
    .filter(linea => linea.length > 1),
  stars: [...new Set(figura.lines.flat())].filter(hip => SKY_BY_HIP.has(hip))
}));

export const FIGURA_POR_ABREVIATURA = new Map(FIGURAS.map(f => [f.abbr, f]));
