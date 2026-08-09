import { BODY_DATA, KNOWN_STAR_BY_SLUG } from "../../../sistema_solar/data.js";

/* Los datos de la escala de soles, en un sitio: los usan la escena, que escribe
   el radio en cada rótulo, y la ficha, que lo repite con sus comparaciones. Con
   dos copias del formato acabarían diciendo cifras distintas de lo mismo. */

/* El Sol no está en el catálogo de estrellas —vive con los planetas— pero es la
   unidad de esta vista, así que se compone aquí. Su radio es 1 por definición:
   1 R☉ = 696.340 km. */
export const SOL = {
  slug: "sun", name: BODY_DATA.sun.name, type: BODY_DATA.sun.type,
  radioSolar: 1, color: BODY_DATA.sun.color, distance: "—",
  description: `${BODY_DATA.sun.description} Su radio, 696.340 km, es la unidad con la que se miden las demás estrellas.`
};

export const estrella = slug => {
  if (slug === "sun") return SOL;
  const s = KNOWN_STAR_BY_SLUG[slug];
  return {
    slug, name: s.name, type: s.type, radioSolar: s.radioSolar, radioNota: s.radioNota,
    color: s.color, distance: s.distance, description: s.description
  };
};

/* Tres escalones, porque en una sola escala esta comparación no se puede ver:
   entre Próxima Centauri (0,15 R☉) y Betelgeuse (764) hay un factor 4.950, y si
   Betelgeuse midiera 9 unidades en pantalla, Próxima mediría 0,0018 —menos de un
   píxel—. Cada escalón repite la mayor del anterior, y esa repetición es lo que
   hace legible el salto. */
export const ESCALONES = [
  { titulo: "Enanas y estrellas como el Sol", soles: ["proxima-centauri", "sun", "sirius", "vega"] },
  { titulo: "Gigantes", soles: ["vega", "acrux", "polaris", "rigel"] },
  { titulo: "Supergigantes", soles: ["rigel", "antares", "betelgeuse"] }
];

export const numero = valor =>
  valor.toLocaleString("es", { maximumFractionDigits: valor < 10 ? 2 : 0 });

/* Cuántas veces cabe una en otra, por volumen: va al cubo del radio, y es la
   cifra que sorprende. Betelgeuse mide 764 veces más de ancho que el Sol, pero
   por dentro le caben 445 millones. */
export function veces(valor) {
  if (valor >= 1e6) return `${numero(Math.round(valor / 1e6))} millones de veces`;
  return `${numero(valor)} veces`;
}

/* Comparar con el Sol tiene dos sentidos según el lado en que caiga la estrella:
   Betelgeuse contiene Soles, y al Sol le caben Próximas dentro. Decir «0,004
   veces» sería exacto e ilegible. */
export function comparacionDeVolumen(sol) {
  const razon = Math.pow(sol.radioSolar, 3);
  return razon >= 1
    ? ["Soles que caben dentro", veces(razon)]
    : [`${sol.name} que caben en el Sol`, veces(1 / razon)];
}
