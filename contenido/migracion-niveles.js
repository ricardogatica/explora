/* De los niveles viejos a las bandas nuevas.

   Dos correspondencias muy distintas, y conviene no confundirlas:

   1. Matemáticas SÍ tenía edades. Su mapa se CALCULA por solapamiento, no se
      opina: cada nivel viejo va a la banda con la que comparte más años.
   2. Lenguaje NO tenía ninguna. Su mapa es un JUICIO DE CONTENIDO, escrito a
      mano, sobre a qué edad se enseña cada tema.

   ─────────────────────────────────────────────────────────────────────────────
   AVISO: las bandas de lenguaje son estimaciones de conocimiento general sobre
   la enseñanza del español, NO están tomadas de las bases curriculares chilenas
   ni de ningún programa oficial. Sirven para que la ruta tenga forma desde el
   primer día; están todas juntas aquí, en una sola tabla, para que alguien con
   formación en didáctica pueda corregirlas de una sentada.
   ─────────────────────────────────────────────────────────────────────────────

   Es el mismo trato que reciben las posiciones de las placas tectónicas en
   earth-epochs.js: dato aproximado, dicho en voz alta, reunido en un sitio. */

import { BANDAS, PREVIO } from "./bandas.js";

/* Los rangos que cubría cada nivel viejo de matemáticas. Se solapaban entre sí
   (los 3 años estaban en dos) y dejaban un hueco en los 5-6; por eso se
   sustituyen. */
const NIVELES_VIEJOS = {
  "nivel-1-3": [1, 3],
  "nivel-3-5": [3, 5],
  "nivel-6-8": [6, 8],
  "nivel-9-11": [9, 11],
  "nivel-12-14": [12, 14],
  "nivel-15-17": [15, 17]
};

function añosEnComun([desde, hasta], banda) {
  return Math.max(0, Math.min(hasta, banda.hasta) - Math.max(desde, banda.desde) + 1);
}

/* La banda que comparte más años con el nivel viejo. Si empatan, gana la más
   temprana: es mejor que un ejercicio aparezca un poco antes de tiempo y se pueda
   saltar, que llegue tarde y ya no sirva. */
function bandaConMasSolape(rango) {
  const candidatas = [PREVIO, ...BANDAS];
  let mejor = null, mejorSolape = 0;
  for (const banda of candidatas) {
    const solape = añosEnComun(rango, banda);
    if (solape > mejorSolape) { mejor = banda; mejorSolape = solape; }
  }
  return mejor?.id ?? null;
}

export const BANDA_POR_NIVEL_VIEJO = Object.fromEntries(
  Object.entries(NIVELES_VIEJOS).map(([nivel, rango]) => [nivel, bandaConMasSolape(rango)])
);

/* Lenguaje: sus 17 preguntas nunca tuvieron edad, solo categoría. Esta tabla es
   el juicio del que habla el aviso de arriba. Criterio seguido, para que se pueda
   discutir en vez de adivinar:

   - Primero lo que se usa al empezar a escribir: mayúsculas.
   - Luego la ortografía que se corrige leyendo: b/v, c/s/z, g/j, h, y la
     acentuación general, que es una regla mecánica.
   - Después lo que exige distinguir función gramatical: tilde diacrítica,
     hiatos, interrogativos, pronombres, preposiciones, verbos, puntuación.
   - Al final lo que ya es composición de textos: conectores y redacción. */
export const BANDA_POR_CATEGORIA_DE_LENGUAJE = {
  "Mayúsculas": "7-8",

  "Acentuación": "9-10",
  "B y V": "9-10",
  "C, S y Z": "9-10",
  "G y J": "9-10",
  "H": "9-10",
  "Concordancia": "9-10",

  "Tilde diacrítica": "11-12",
  "Hiatos": "11-12",
  "Interrogativos": "11-12",
  "Pronombres": "11-12",
  "Preposiciones": "11-12",
  "Verbos": "11-12",
  "Puntuación": "11-12",

  "Conectores": "13-14",
  "Redacción clara": "13-14"
};
