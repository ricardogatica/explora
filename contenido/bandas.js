/* Las bandas de edad de la ruta de aprendizaje.

   Toda página y toda pregunta lleva una: son lo que permite recorrer Explora de
   los 5 a los 17 años atravesando las materias, y lo que un padre usa para saber
   qué le toca a su hijo.

   Particionan las edades: cada una empieza donde termina la anterior, sin huecos
   ni solapes. No es un detalle de estilo. Las bandas anteriores de matemáticas
   —1-3, 3-5, 6-8, 9-11, 12-14, 15-17— tenían los 3 años en dos tramos y ningún
   tramo para los 5 y los 6, así que una ruta armada con ellas habría dejado sin
   nada justo a la edad en la que se empieza.

   Los tramos son de dos años porque es lo que aguanta el contenido: uno por año
   multiplica el etiquetado y deja cada tramo casi vacío. El último es de tres
   porque a esas edades la diferencia de un año pesa menos.

   El identificador dice las edades que cubre, y eso es deliberado: se escribe a
   mano en cada archivo de contenido, así que tiene que poder leerse. "9-10" son
   los 9 y los 10 años. */

export const BANDAS = [
  { id: "5-6",   desde: 5,  hasta: 6,  titulo: "5 a 6 años",   etapa: "Primeros pasos" },
  { id: "7-8",   desde: 7,  hasta: 8,  titulo: "7 a 8 años",   etapa: "Lectura y cálculo iniciales" },
  { id: "9-10",  desde: 9,  hasta: 10, titulo: "9 a 10 años",  etapa: "Consolidación" },
  { id: "11-12", desde: 11, hasta: 12, titulo: "11 a 12 años", etapa: "Pensamiento abstracto" },
  { id: "13-14", desde: 13, hasta: 14, titulo: "13 a 14 años", etapa: "Razonamiento formal" },
  { id: "15-17", desde: 15, hasta: 17, titulo: "15 a 17 años", etapa: "Profundización" }
];

/* Lo anterior a la ruta. Matemáticas tiene dos páginas completas escritas para
   1 a 5 años; están bien y sirven, así que se conservan marcadas así: se llega a
   ellas, pero no forman parte de la progresión. */
export const PREVIO = {
  id: "previo", desde: 0, hasta: 4,
  titulo: "Antes de los 5 años", etapa: "Exploración temprana"
};

const POR_ID = new Map([...BANDAS, PREVIO].map(banda => [banda.id, banda]));

export function bandaPorId(id) {
  return POR_ID.get(id) ?? null;
}

/* La banda de una edad concreta. Por debajo de 5 devuelve `previo`; por encima
   de 17, null: Explora no cubre esas edades y decirlo es mejor que devolver la
   última banda como si sirviera. */
export function bandaDeEdad(edad) {
  if (edad < BANDAS[0].desde) return PREVIO;
  return BANDAS.find(banda => edad >= banda.desde && edad <= banda.hasta) ?? null;
}

export function esBandaDeRuta(id) {
  return BANDAS.some(banda => banda.id === id);
}

/* Todos los identificadores válidos, para validar contenido sin recorrer dos
   listas y olvidarse de `previo`, que es justo lo que pasaría. */
export const IDS_VALIDOS = [...POR_ID.keys()];
