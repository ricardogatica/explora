/* Todas las rutas que el build tiene que convertir en HTML.

   Se leen del catálogo, no de una lista escrita a mano: son 415 fichas y
   mantener una lista al día es imposible. Cuando se añada una estrella al
   catálogo, su página existirá sin que nadie se acuerde de nada. */
import { buildCatalog } from "../../../sistema_solar/nav-model.js";

export function rutasParaPrerenderizar() {
  const fijas = ["/", "/indice", "/referencias", "/escala-planetaria", "/escala-de-soles", "/constelaciones"];
  const fichas = buildCatalog().flatMap(grupo =>
    grupo.entries.map(entrada => rutaDeEntrada(grupo.id, entrada.slug))
  );
  return [...fijas, ...new Set(fichas)];
}

/* Un tipo de ficha por grupo del catálogo, en español y sin .html: son las URL
   que va a ver la gente y las que va a indexar un buscador. */
export function rutaDeEntrada(grupo, slug) {
  switch (grupo) {
    case "solar": return `/cuerpos/${slug}`;
    case "stars": return `/estrellas/${slug}`;
    case "constellations": return `/constelaciones/${slug}`;
    case "galaxies": return `/galaxias/${slug}`;
    default: return `/${slug}`;
  }
}
