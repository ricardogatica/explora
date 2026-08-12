/* Qué decirle a alguien al terminar una tanda.

   Está fuera del componente para poder probarlo: los umbrales son una decisión
   pedagógica, no un detalle de pintado, y equivocarse en ellos manda a un niño hacia
   atrás sin motivo o lo deja atascado sin avisar.

   Tres respuestas posibles, y la tercera es la que más cuesta respetar:

   · Por debajo de la mitad, volver un tramo. No es un castigo: casi siempre falta
     algo de antes, y repetir el mismo tramo no lo arregla.
   · Con 85 o más de cada 100, seguir. Ese umbral es alto a propósito: decirle a
     alguien que avance cuando aún falla una de cada cuatro es empujarlo a un sitio
     donde se va a atascar.
   · En medio, callarse. No hay nada seguro que decir, y un consejo dudoso es peor
     que ninguno: si se propone retroceder a quien va bien, la próxima vez no se hace
     caso del consejo aunque acierte. */

export const MAL = 0.5;
export const BIEN = 0.85;

export function consejoDeTanda(puntos, maximo, tramo) {
  if (!tramo || !maximo) return null;
  const proporcion = puntos / maximo;

  if (proporcion < MAL && tramo.anterior) return { tipo: "atras", proporcion };
  if (proporcion >= BIEN && tramo.siguiente) return { tipo: "adelante", proporcion };
  return null;
}
