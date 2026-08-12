/* Las bandas de edad de la ruta de aprendizaje.

   Toda página y toda pregunta lleva una: son lo que permite recorrer Explora de los
   4 a los 17 años atravesando las materias, y lo que un adulto usa para saber qué le
   toca a quien acompaña.

   Particionan las edades: cada una empieza donde termina la anterior, sin huecos ni
   solapes. No es un detalle de estilo. Las bandas de la primera versión de
   matemáticas —1-3, 3-5, 6-8, 9-11, 12-14, 15-17— tenían los 3 años en dos tramos y
   ningún tramo para los 5 y los 6, así que una ruta armada con ellas dejaba sin nada
   justo a la edad en la que se empieza.

   Los tramos son de dos años porque es lo que aguanta el contenido: uno por año
   multiplica el etiquetado y deja cada tramo casi vacío.

   El identificador dice las edades que cubre, y eso es deliberado: se escribe a mano
   en cada archivo de contenido, así que tiene que poder leerse. "10-11" son los 10 y
   los 11 años.

   El primero es distinto de los otros seis y lo dice en su propio campo. A los 4 y 5
   años quien usa Explora no es el niño: es el adulto que le enseña. Ahí no hay
   ejercicios que resolver en pantalla, hay material para imprimir y observaciones
   para anotar. Marcarlo con un campo y no con un comentario permite que la interfaz
   lo trate distinto sin adivinarlo por el identificador. */

export const BANDAS = [
  {
    id: "4-5", desde: 4, hasta: 5,
    titulo: "4 a 5 años", etapa: "Con un adulto",
    /* No es una banda menos importante: es una con otro destinatario. Lo que se
       ofrece aquí son manuales y ejercicios para imprimir, y observaciones que anota
       quien acompaña. */
    paraAdultos: true
  },
  { id: "6-7",   desde: 6,  hasta: 7,  titulo: "6 a 7 años",   etapa: "Primeros pasos" },
  { id: "8-9",   desde: 8,  hasta: 9,  titulo: "8 a 9 años",   etapa: "Lectura y cálculo" },
  { id: "10-11", desde: 10, hasta: 11, titulo: "10 a 11 años", etapa: "Consolidación" },
  { id: "12-13", desde: 12, hasta: 13, titulo: "12 a 13 años", etapa: "Pensamiento abstracto" },
  { id: "14-15", desde: 14, hasta: 15, titulo: "14 a 15 años", etapa: "Razonamiento formal" },
  { id: "16-17", desde: 16, hasta: 17, titulo: "16 a 17 años", etapa: "Profundización" }
];

const POR_ID = new Map(BANDAS.map(banda => [banda.id, banda]));

export function bandaPorId(id) {
  return POR_ID.get(id) ?? null;
}

/* La banda de una edad concreta. Fuera de 4 a 17 devuelve null: Explora no cubre
   esas edades, y decirlo es mejor que devolver la banda del borde como si sirviera. */
export function bandaDeEdad(edad) {
  return BANDAS.find(banda => edad >= banda.desde && edad <= banda.hasta) ?? null;
}

/* Todas las bandas son de la ruta. Esta función existía cuando había una etiqueta
   —«previo»— que llevaba contenido pero no formaba parte de la progresión, y se
   quedó porque quien pinta un enlace a /ruta/<banda>/ tiene que poder preguntar si
   ese destino existe, sin depender de que hoy la respuesta sea siempre sí. */
export function esBandaDeRuta(id) {
  return POR_ID.has(id);
}

/* La banda anterior y la siguiente, para moverse por la progresión. Devuelven null
   en los extremos, que es lo que permite no pintar un enlace a ninguna parte. */
export function bandaAnteriorA(id) {
  const indice = BANDAS.findIndex(banda => banda.id === id);
  return indice > 0 ? BANDAS[indice - 1] : null;
}

export function bandaSiguienteA(id) {
  const indice = BANDAS.findIndex(banda => banda.id === id);
  return indice >= 0 && indice < BANDAS.length - 1 ? BANDAS[indice + 1] : null;
}

/* Todos los identificadores válidos, para validar contenido sin recorrer la lista y
   olvidarse de alguno. */
export const IDS_VALIDOS = BANDAS.map(banda => banda.id);
