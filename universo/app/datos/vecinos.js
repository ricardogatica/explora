/* La ficha anterior y la siguiente.

   El sitio anterior ya tenía esto y era de lo más útil que tenía: recorrer los
   planetas en orden, o las estrellas de la más cercana a la más lejana, enseña
   algo que una lista alfabética no enseña. Se conserva el mismo orden del
   catálogo, que no es alfabético a propósito.

   Se apoya en nav-model.js, que es lógica pura y tiene sus propios tests desde
   antes de esta migración: aquí solo se traduce su salida a rutas nuevas. */

import { siblingsFor } from "../../cielo/nav-model.js";
import { rutaDeEntrada } from "./rutas.js";

export function hermanosDe(grupo, slug) {
  const { prev, next } = siblingsFor(slug);
  const traducir = entrada =>
    entrada ? { texto: entrada.name, a: rutaDeEntrada(grupo, entrada.slug) } : null;
  const anterior = traducir(prev), siguiente = traducir(next);
  return anterior || siguiente ? { anterior, siguiente } : null;
}
