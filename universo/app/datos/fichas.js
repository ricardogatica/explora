/* Las fichas del universo, en una sola forma.

   Hay cuatro clases de objeto —cuerpos del sistema solar, estrellas,
   constelaciones y galaxias— con campos distintos cada una. Aquí se traducen a
   la misma estructura para que exista un solo componente de ficha en vez de
   cuatro que se van pareciendo cada vez menos, que es lo que pasó con los dos
   app.js de las materias.

   Los datos se importan del catálogo directamente. No hay `loader`: son
   constantes que el empaquetador incluye, y en un sitio que se prerenderiza
   entero pedirlas por red sería dar un rodeo para llegar al mismo sitio. */

import {
  BODY_DATA, CONSTELLATION_BY_SLUG, KNOWN_GALAXY_BY_SLUG, KNOWN_STAR_BY_SLUG
} from "../../cielo/data.js";
import { rutaDeEntrada } from "./rutas.js";

const sinVacios = pares => pares.filter(([, valor]) => valor !== undefined && valor !== null && valor !== "");

function deCuerpo(slug) {
  const cuerpo = BODY_DATA[slug];
  if (!cuerpo) return null;
  return {
    grupo: "solar",
    titulo: cuerpo.name,
    tipo: cuerpo.type,
    descripcion: cuerpo.description,
    nota: cuerpo.interaction,
    datos: sinVacios([
      ["Gravedad", cuerpo.gravity],
      ["Equivalencia", cuerpo.gravityFactor],
      ["Diámetro", cuerpo.diameter],
      ["Distancia al Sol", cuerpo.distance],
      ["Año orbital", cuerpo.year],
      ["Día / rotación", cuerpo.day],
      ["Temperatura", cuerpo.temperature],
      ["Satélites", cuerpo.moons]
    ]),
    escena: { tipo: "cuerpo", slug }
  };
}

function deEstrella(slug) {
  const estrella = KNOWN_STAR_BY_SLUG[slug];
  if (!estrella) return null;
  return {
    grupo: "stars",
    titulo: estrella.name,
    tipo: estrella.type,
    descripcion: estrella.description,
    nota: estrella.behavior,
    datos: sinVacios([
      ["Constelación", estrella.constellation],
      ["Distancia", estrella.distance],
      ["Magnitud aparente", estrella.magnitude],
      ["Tipo espectral", estrella.spectralType],
      ["Radio", estrella.radioSolar ? `${estrella.radioSolar} R☉` : null],
      ["Edad", estrella.age],
      ["Masa", estrella.mass],
      ["Corrimiento al rojo", estrella.redshift]
    ]),
    /* El aviso de la medida va con el dato y no en una nota al pie: el radio de
       una supergigante varía según el método y decirlo es parte del dato. */
    aviso: estrella.radioNota,
    escena: { tipo: "estrella", slug }
  };
}

function deConstelacion(slug) {
  const constelacion = CONSTELLATION_BY_SLUG[slug];
  if (!constelacion) return null;
  const masBrillante = [...constelacion.points].sort((a, b) => a.mag - b.mag)[0];
  return {
    grupo: "constellations",
    titulo: constelacion.name,
    tipo: `Constelación · ${constelacion.latin} (${constelacion.abbr})`,
    descripcion: constelacion.description,
    datos: sinVacios([
      ["Hemisferio", constelacion.hemisphere],
      ["Estrellas de la figura", String(constelacion.points.length)],
      ["Extensión en el cielo", `${constelacion.extensionGrados}°`],
      ["Más brillante", `${masBrillante.name} (magnitud ${masBrillante.mag})`]
    ]),
    estrellas: [...constelacion.points]
      .sort((a, b) => a.mag - b.mag)
      .map(punto => ({
        slug: punto.starSlug, nombre: punto.name, magnitud: punto.mag, tipo: punto.type
      })),
    escena: { tipo: "constelacion", slug }
  };
}

function deGalaxia(slug) {
  const galaxia = KNOWN_GALAXY_BY_SLUG[slug];
  if (!galaxia) return null;
  return {
    grupo: "galaxies",
    titulo: galaxia.name,
    tipo: galaxia.type,
    descripcion: galaxia.description,
    nota: galaxia.behavior,
    datos: sinVacios([
      ["Diámetro", galaxia.diameter],
      ["Edad", galaxia.age],
      ["Distancia", galaxia.distance],
      ["Región", galaxia.region],
      ["Escala", galaxia.distanceScale]
    ]),
    escena: { tipo: "galaxia", slug }
  };
}

const POR_GRUPO = {
  solar: deCuerpo, stars: deEstrella, constellations: deConstelacion, galaxies: deGalaxia
};

export function fichaDe(grupo, slug) {
  const ficha = POR_GRUPO[grupo]?.(slug);
  return ficha ? { ...ficha, slug, ruta: rutaDeEntrada(grupo, slug) } : null;
}
