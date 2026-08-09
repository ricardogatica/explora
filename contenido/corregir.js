/* Corrección de respuestas.

   Vive con el contenido y no con la interfaz porque es una decisión de
   contenido: qué cuenta como acertar. Y porque así se puede probar, que es lo
   que importa cuando el que se equivoca es un niño y el que se equivoca de
   verdad es el corrector.

   La regla que más pesa está en `normalizar`: NO se quitan las tildes. En
   matemáticas daría igual, pero en lenguaje la tilde es justo lo que se está
   preguntando, y un corrector que acepta «cancion» como «canción» enseña lo
   contrario de lo que pretende. Sí se perdonan las mayúsculas, los espacios de
   más y la coma decimal, que son ruido de tecleo y no la respuesta. */

export function normalizar(valor) {
  return String(valor ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    // 3,5 y 3.5 son el mismo número: en Chile se escribe con coma y el teclado
    // numérico pone punto.
    .replace(",", ".");
}

const mismosElementos = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/* ¿Es correcta? Devuelve null cuando la pregunta no se corrige, que es el caso
   de las observaciones: ahí un adulto anota lo que ve y no hay acierto ni
   error. Distinguirlo de `false` evita que la interfaz pinte de rojo a un niño
   por algo que no era una prueba. */
export function esCorrecta(pregunta, respuesta) {
  switch (pregunta.tipo) {
    case "multiple-choice":
      return respuesta === pregunta.respuesta;

    case "fill": {
      const validas = [pregunta.respuesta, ...(pregunta.aceptadas ?? [])].map(normalizar);
      return validas.includes(normalizar(respuesta));
    }

    case "observation":
      return null;

    case "drag-match": {
      const esperado = pregunta.respuesta;
      const claves = Object.keys(esperado);
      return claves.length === Object.keys(respuesta ?? {}).length &&
        claves.every(clave => respuesta?.[clave] === esperado[clave]);
    }

    case "drag-order":
      return mismosElementos(pregunta.respuesta, respuesta ?? []);

    default:
      return false;
  }
}

/* Cuánto suma una respuesta. Las observaciones traen su propia tabla —«a veces»
   vale 1— y el resto vale 1 si se acierta. El máximo se calcula igual, para que
   un diagnóstico pueda decir «14 de 22» sin que nadie sume a mano. */
export function puntaje(pregunta, respuesta) {
  if (pregunta.tipo === "observation") return pregunta.puntaje?.[respuesta] ?? 0;
  return esCorrecta(pregunta, respuesta) ? 1 : 0;
}

export function puntajeMaximo(pregunta) {
  if (pregunta.tipo === "observation") return Math.max(...Object.values(pregunta.puntaje ?? { 0: 0 }));
  return 1;
}

/* Qué mostrar al corregir. Práctica explica por qué; diagnóstico devuelve una
   lectura al adulto. Son campos distintos porque dicen cosas distintas. */
export const comentario = pregunta => pregunta.explicacion ?? pregunta.retroalimentacion ?? "";
