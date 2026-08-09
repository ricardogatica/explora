/* Figuras dentro del markdown.

   Una página de geometría que explica el volumen de una esfera debería poder
   poner una esfera ahí mismo, sin que quien escribe toque código:

       ::figura{tipo=esfera radio=2 titulo="Una esfera de radio 2"}

   La línea parte el texto en tres: lo de antes, la figura, y lo de después. Eso
   es todo lo que hace este módulo, y por eso está aquí y no en la aplicación:
   trocear es una regla del formato de contenido, se puede probar sin navegador,
   y sobrevivirá al framework que hoy lo pinta.

   La sintaxis imita a MDC, que es la de Nuxt Content, por si algún día se vuelve
   a mirar hacia allí; pero no depende de nada. */

const LINEA_DE_FIGURA = /^::figura\{(.*)\}\s*$/;

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
    const figura = linea.match(LINEA_DE_FIGURA);
    if (!figura) {
      acumulado.push(linea);
      continue;
    }
    cerrarMarkdown();
    const { tipo, titulo, ...parametros } = leerAtributos(figura[1]);
    bloques.push({ tipo: "figura", figura: tipo, titulo, parametros });
  }
  cerrarMarkdown();

  return bloques;
}

/* Las figuras que declara una página, sin trocear nada: sirve para validar en el
   build que ninguna pide una figura que no existe. */
export function figurasDe(markdown) {
  return partirEnBloques(markdown).filter(bloque => bloque.tipo === "figura");
}
