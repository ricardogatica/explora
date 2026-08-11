/* Figuras y actividades dentro del markdown.

   Una página de geometría que explica el volumen de una esfera debería poder
   poner una esfera ahí mismo, sin que quien escribe toque código:

       ::figura{tipo=esfera radio=2 titulo="Una esfera de radio 2"}

   Y una que explica las potencias debería poder poner algo con lo que jugar,
   porque hay ideas que no se entienden leyéndolas:

       ::actividad{tipo=potencias base=2 exponente=5}

   La línea parte el texto en tres: lo de antes, el bloque, y lo de después. Eso
   es todo lo que hace este módulo, y por eso está aquí y no en la aplicación:
   trocear es una regla del formato de contenido, se puede probar sin navegador,
   y sobrevivirá al framework que hoy lo pinta.

   Son dos clases y no una porque son cosas distintas: una figura se mira y una
   actividad se usa. Mezclarlas obligaría a que quien pinta adivine cuál es cuál
   por el nombre, que es como se acaba con un «esfera» interactiva por accidente.

   La sintaxis imita a MDC, que es la de Nuxt Content, por si algún día se vuelve
   a mirar hacia allí; pero no depende de nada. */

const LINEA_DE_BLOQUE = /^::(figura|actividad)\{(.*)\}\s*$/;

/* Atributos al estilo HTML: `clave=valor`, con comillas cuando el valor lleva
   espacios. Se acepta lo que alguien escribiría a mano sin pensar. */
export function leerAtributos(texto) {
  const atributos = {};
  const patron = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
  let coincidencia;
  while ((coincidencia = patron.exec(texto)) !== null) {
    const [, clave, dobles, simples, suelto] = coincidencia;
    atributos[clave] = dobles ?? simples ?? suelto;
  }
  return atributos;
}

/* Parte el texto en bloques alternos de markdown y figuras. Los bloques de
   markdown vacíos se descartan: una figura entre dos párrafos no debe dejar un
   hueco de nada en medio. */
export function partirEnBloques(markdown) {
  const bloques = [];
  let acumulado = [];

  const cerrarMarkdown = () => {
    const texto = acumulado.join("\n").trim();
    if (texto) bloques.push({ tipo: "markdown", texto });
    acumulado = [];
  };

  for (const linea of markdown.split("\n")) {
    const encontrado = linea.match(LINEA_DE_BLOQUE);
    if (!encontrado) {
      acumulado.push(linea);
      continue;
    }
    cerrarMarkdown();
    const [, clase, atributos] = encontrado;
    const { tipo, titulo, ...parametros } = leerAtributos(atributos);
    /* El nombre del bloque se guarda en la clave que le corresponde —`figura` o
       `actividad`— y no en una genérica: así quien pinta no puede confundirse de
       registro, y un bloque de una clase con el nombre de la otra no existe. */
    bloques.push(clase === "figura"
      ? { tipo: "figura", figura: tipo, titulo, parametros }
      : { tipo: "actividad", actividad: tipo, titulo, parametros });
  }
  cerrarMarkdown();

  return bloques;
}

/* Las figuras que declara una página, sin trocear nada: sirve para validar en el
   build que ninguna pide una figura que no existe. */
export function figurasDe(markdown) {
  return partirEnBloques(markdown).filter(bloque => bloque.tipo === "figura");
}

/* Lo mismo para las actividades. Una actividad mal escrita tiene que romper el
   build igual que una figura: el nombre se teclea a mano dentro de un markdown y
   dejar un hueco en silencio es lo peor que puede pasar. */
export function actividadesDe(markdown) {
  return partirEnBloques(markdown).filter(bloque => bloque.tipo === "actividad");
}
