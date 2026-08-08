/* Las estrellas del atlas.

   Antes eran 108: nueve escritas a mano y noventa y nueve generadas con datos
   aproximados. Las generadas heredaban la coordenada de su constelación, así
   que todas las de Orión ocupaban el mismo punto del cielo y las figuras no se
   parecían a nada; sus descripciones eran plantillas.

   Ahora son las 744 del catálogo real: posición, magnitud, distancia y tipo
   espectral medidos. Las nueve con ficha propia conservan su texto escrito a
   mano, que dice más que cualquier plantilla, pero sus números vienen del
   catálogo.

   Ver la cabecera de sky-catalog.js: HYG y Stellarium, ambos CC BY-SA 4.0.
*/

import { CONSTELLATION_BY_SLUG, CONSTELLATIONS } from "./constellations.js";
import { SKY, SKY_BY_SLUG, radioDesdeDistancia } from "./sky.js";

/* Texto propio de las que ya tenían ficha. Los datos numéricos se toman del
   catálogo salvo en las dos que no aparecen en ninguna figura: Próxima
   Centauri es de magnitud 11, invisible a simple vista, y TON 618 es un quásar
   a diez mil millones de años luz. Esas dos conservan sus valores. */
const PROPIAS = [
  {slug:"sirius",kind:"star",name:"Sirio",age:"≈242 Ma",visibleFrom:"first-stars",description:"La estrella más brillante del cielo nocturno vista desde la Tierra; en realidad es un sistema binario.",behavior:"En la vista de universo actúa como referencia cercana y brillante: al acercarte se muestra como sistema estelar y no como planeta."},
  {slug:"vega",kind:"star",name:"Vega",age:"≈455 Ma",visibleFrom:"first-stars",description:"Estrella brillante del hemisferio norte y referencia histórica para calibraciones fotométricas.",behavior:"Se muestra como estrella blanca-azulada, útil para comparar brillo y color con otras estrellas conocidas."},
  {slug:"betelgeuse",kind:"star",name:"Betelgeuse",age:"≈8–10 Ma",visibleFrom:"first-stars",description:"Supergigante roja evolucionada de Orión, mucho más grande que el Sol y en una etapa avanzada de vida estelar.",behavior:"Debe verse grande y rojiza: representa una estrella masiva envejecida con atmósfera extendida y variación de brillo."},
  {slug:"rigel",kind:"star",name:"Rigel",age:"≈8 Ma",visibleFrom:"first-stars",description:"Una de las estrellas más luminosas visibles a simple vista, ubicada en la constelación de Orión.",behavior:"Se visualiza como supergigante azul, más caliente en color que Betelgeuse y parte de la referencia de Orión."},
  {slug:"proxima-centauri",kind:"star",name:"Próxima Centauri",age:"≈4.850 Ma",visibleFrom:"first-stars",description:"La estrella más cercana al Sol, parte del sistema Alfa Centauri y con al menos un planeta confirmado.",behavior:"Se presenta como enana roja cercana; su escala visual se amplifica para poder seleccionarla sin perder su detalle.",type:"Enana roja",constellation:"Centauro",distance:"4,24 años luz",distanceLy:4.24,color:16751469,size:4.2,direction:[0.31, -0.24, -0.92]},
  {slug:"polaris",kind:"star",name:"Polaris",age:"≈70 Ma",visibleFrom:"first-stars",description:"La Estrella Polar actual, cercana al polo norte celeste y útil para orientación.",behavior:"Funciona como marcador de orientación celeste y estrella variable de tipo cefeida."},
  {slug:"antares",kind:"star",name:"Antares",age:"≈11 Ma",visibleFrom:"first-stars",description:"Estrella rojiza muy luminosa en Escorpio, con un tamaño enorme comparado con el Sol.",behavior:"Se muestra como supergigante roja, comparable visualmente con Betelgeuse por color y evolución."},
  {slug:"acrux",kind:"star",name:"Acrux",age:"≈10–20 Ma",visibleFrom:"first-stars",description:"La estrella más brillante de la Cruz del Sur, visible desde latitudes australes.",behavior:"Representa un sistema múltiple: se muestra como punto azul intenso asociado a la Cruz del Sur."},
  {slug:"ton-618",kind:"quasar",name:"TON 618",age:"Luz emitida cuando el universo era joven",visibleFrom:"early-galaxies",description:"TON 618 es un quásar extremadamente distante alimentado por un agujero negro ultramasivo. Su energía proviene de gas caliente en acreción alrededor del agujero negro central.",behavior:"En la vista del universo aparece como núcleo activo: disco de acreción brillante, halo y chorros relativistas. No pertenece al sistema solar; se activa al abrir el zoom cósmico.",type:"Quásar hiperluminoso",constellation:"Canes Venatici / Coma Berenices",distance:">10.000 millones de años luz de tiempo de viaje de la luz",distanceLy:10400000000,color:16765834,size:14,direction:[0.66, 0.27, -0.7],mass:"Más de 60.000 millones de masas solares",redshift:"z ≈ 2,219"}
];

const NOMBRE_CONSTELACION = new Map(CONSTELLATIONS.map(c => [c.abbr, c.name]));

const ESCALA = "Escala radial logarítmica en años luz";

function desdeCatalogo(estrella, propia) {
  const constelacion = NOMBRE_CONSTELACION.get(estrella.con) ?? estrella.con;

  /* Sin nombre propio, se compone con la designación de Bayer y el nombre
     español de la constelación: "Pi-1 de Orión". El catálogo trae "Pi-1 Orion",
     con el latino, que en un sitio en español queda a medias. */
  const nombre = estrella.named || !estrella.bayer
    ? estrella.name
    : `${estrella.bayer} de ${constelacion}`;

  return {
    slug: estrella.slug,
    hip: estrella.hip,
    kind: "star",
    name: nombre,
    type: estrella.type,
    constellation: constelacion,
    visibleFrom: "first-stars",
    distance: estrella.ly ? `${estrella.ly} años luz` : "Distancia no determinada",
    distanceLy: estrella.ly ?? 500,
    magnitude: estrella.mag,
    spectralType: estrella.spect,
    direction: estrella.direction,
    position: estrella.position,
    color: estrella.color,
    size: estrella.size,
    named: estrella.named,
    file: estrella.file,
    distanceScale: ESCALA,
    age: propia?.age ?? "Edad no determinada en este atlas",
    description: propia?.description ??
      `${estrella.type} de la constelación ${constelacion}, a ${estrella.ly ?? "?"} años luz. Su magnitud aparente es ${estrella.mag}: cuanto menor el número, más brillante se ve desde la Tierra. Su tipo espectral, ${estrella.spect}, es lo que fija su color.`,
    behavior: propia?.behavior ??
      `Se dibuja en su posición real del cielo, con el color que le corresponde por temperatura y un tamaño proporcional a su brillo aparente.`,
    ...(propia?.mass ? { mass: propia.mass } : {}),
    ...(propia?.redshift ? { redshift: propia.redshift } : {})
  };
}

/* Las que no están en ninguna figura se construyen con sus propios valores. */
function sueltas(propia) {
  const radio = radioDesdeDistancia(propia.distanceLy);
  const mag = Math.hypot(...propia.direction) || 1;
  const direccion = propia.direction.map(v => v / mag);
  return {
    ...propia,
    direction: direccion,
    position: direccion.map(v => v * radio),
    distanceScale: ESCALA,
    file: `${propia.slug}.html`,
    named: true
  };
}

const PROPIAS_POR_SLUG = new Map(PROPIAS.map(p => [p.slug, p]));
const enFiguras = new Set(SKY.map(s => s.slug));

export const KNOWN_STARS = [
  ...SKY.map(estrella => desdeCatalogo(estrella, PROPIAS_POR_SLUG.get(estrella.slug))),
  ...PROPIAS.filter(p => !enFiguras.has(p.slug)).map(sueltas)
];

export const KNOWN_STAR_BY_SLUG = Object.fromEntries(KNOWN_STARS.map(s => [s.slug, s]));

export { CONSTELLATION_BY_SLUG, CONSTELLATIONS, SKY_BY_SLUG };
