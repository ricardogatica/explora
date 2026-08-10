/* Qué es un evento de progreso válido.

   Vive aparte del framework a propósito, como el resto de la lógica del
   proyecto: aquí no hay Nest, ni base de datos, ni petición HTTP. Solo la
   pregunta «¿esto que ha llegado se puede guardar?», que es la que conviene
   poder probar sin levantar nada.

   Todo lo que entra viene de un navegador y por tanto de nadie de fiar: se
   valida el tipo de cada campo y se recorta lo que pueda venir largo. No es
   paranoia, es que el identificador de sesión lo genera el propio navegador
   —así el progreso funciona aunque la API esté caída— y eso significa que
   cualquiera puede mandar lo que quiera. */

import { MATERIAS, FAMILIAS } from "@explora/contenido/esquema.js";
import { IDS_VALIDOS } from "@explora/contenido/bandas.js";

/* El único modo que existe hoy. Crear cuenta está anunciado en la interfaz
   pero no implementado, así que la API no lo acepta todavía: prefiero un 400
   claro a guardar filas de un modo que aún no significa nada. */
export const MODOS = ["local"];

/* Un uuid v4 tal y como lo genera crypto.randomUUID() en el navegador. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* Lo que teclea quien responde se guarda porque enseña más que un sí o un no:
   ver que veinte niños escriben «aver» dice qué hay que explicar mejor, y
   «falló» no dice nada. Se recorta porque es texto libre de un campo abierto y
   no hay razón para aceptar más que una respuesta corta. */
export const LARGO_MAXIMO_DE_RESPUESTA = 100;

const esTexto = valor => typeof valor === "string" && valor.trim() !== "";
const enteroNoNegativo = valor => Number.isInteger(valor) && valor >= 0;

/* Devuelve { evento } o { errores }. Nunca lanza: quien llama decide qué
   código HTTP corresponde, que es cosa del transporte y no de aquí. */
export function validarRespuesta(cuerpo) {
  const errores = [];
  const añadir = mensaje => errores.push(mensaje);
  const c = cuerpo ?? {};

  if (!esTexto(c.sesion) || !UUID.test(c.sesion)) añadir("«sesion» tiene que ser un uuid");
  if (!MATERIAS.has(c.materia)) añadir(`«materia» tiene que ser una de: ${[...MATERIAS].join(", ")}`);
  if (!IDS_VALIDOS.includes(c.banda)) añadir(`«banda» tiene que ser una de: ${IDS_VALIDOS.join(", ")}`);
  if (!FAMILIAS.has(c.familia)) añadir(`«familia» tiene que ser una de: ${[...FAMILIAS].join(", ")}`);
  if (!esTexto(c.pregunta)) añadir("«pregunta» tiene que ser el id de la pregunta");

  /* Las observaciones no tienen respuesta correcta —se pregunta qué ve, no si
     acierta—, así que «correcta» puede venir nula a propósito. */
  if (c.correcta !== null && typeof c.correcta !== "boolean") {
    añadir("«correcta» tiene que ser true, false o null");
  }
  if (c.ms !== undefined && !enteroNoNegativo(c.ms)) añadir("«ms» tiene que ser un entero de milisegundos");

  if (errores.length) return { errores };

  return {
    evento: {
      sesion: c.sesion,
      materia: c.materia,
      banda: c.banda,
      familia: c.familia,
      pregunta: c.pregunta.trim().slice(0, 120),
      correcta: c.correcta ?? null,
      escrito: recortarEscrito(c.escrito),
      ms: c.ms ?? null
    }
  };
}

/* Solo las preguntas de escribir traen esto. Se guarda tal cual lo tecleó
   —sin normalizar—, porque la falta de ortografía es justo el dato: quien lo
   lea querrá ver «aver» y no «a ver». */
function recortarEscrito(valor) {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim().slice(0, LARGO_MAXIMO_DE_RESPUESTA);
  return limpio === "" ? null : limpio;
}

export function validarSesion(cuerpo) {
  const c = cuerpo ?? {};
  const errores = [];
  if (!esTexto(c.id) || !UUID.test(c.id)) errores.push("«id» tiene que ser un uuid");
  if (!MODOS.includes(c.modo)) errores.push(`«modo» tiene que ser uno de: ${MODOS.join(", ")}`);
  return errores.length ? { errores } : { sesion: { id: c.id, modo: c.modo } };
}
