/* Frontmatter de las páginas: una página es un archivo.

   Antes eran dos. El texto vivía en `pages/<id>.md` y su título, categoría y
   descripción en `data/manifest.json`, así que añadir una página obligaba a
   escribir en dos sitios y olvidarse del segundo dejaba la página invisible sin
   dar ningún error. Ahora la metadata va en la cabecera del propio archivo.

   El formato es un subconjunto muy pequeño de YAML —`clave: valor`, y listas
   entre corchetes— y se lee con veinte líneas en vez de con una dependencia. No
   es tacañería: el contrato de contenido es lo único que no debería depender de
   nada, porque es lo que sobrevive a los cambios de framework. Si algún día el
   frontmatter necesita YAML de verdad, se cambia esto y nada más. */

const DELIMITADOR = "---";

/* Se aceptan comillas alrededor del valor y se quitan: hacen falta cuando el
   valor lleva dos puntos («Nivel 6 a 8: primer ciclo») y estorban leerlo. */
function valorDe(bruto) {
  const limpio = bruto.trim();
  if (limpio.startsWith("[") && limpio.endsWith("]")) {
    return limpio.slice(1, -1).split(",").map(x => valorDe(x)).filter(x => x !== "");
  }
  if ((limpio.startsWith('"') && limpio.endsWith('"')) ||
      (limpio.startsWith("'") && limpio.endsWith("'"))) {
    return limpio.slice(1, -1);
  }
  return limpio;
}

export function separarFrontmatter(texto) {
  const lineas = texto.split("\n");
  if (lineas[0].trim() !== DELIMITADOR) {
    return { meta: {}, cuerpo: texto, tieneFrontmatter: false };
  }
  const cierre = lineas.findIndex((linea, i) => i > 0 && linea.trim() === DELIMITADOR);
  if (cierre === -1) {
    return { meta: {}, cuerpo: texto, tieneFrontmatter: false };
  }

  const meta = {};
  for (const linea of lineas.slice(1, cierre)) {
    if (!linea.trim() || linea.trimStart().startsWith("#")) continue;
    const corte = linea.indexOf(":");
    if (corte === -1) continue;
    // Solo el PRIMER dos puntos separa: los siguientes son parte del valor.
    meta[linea.slice(0, corte).trim()] = valorDe(linea.slice(corte + 1));
  }
  return { meta, cuerpo: lineas.slice(cierre + 1).join("\n").replace(/^\n+/, ""), tieneFrontmatter: true };
}

/* Se entrecomilla cuando el valor podría confundir al lector de arriba: si lleva
   dos puntos, o si empieza por un carácter que en YAML significa otra cosa. */
function escribirValor(valor) {
  if (Array.isArray(valor)) return `[${valor.join(", ")}]`;
  const texto = String(valor);
  return /[:#]|^[[\-'"]/.test(texto) ? `"${texto.replace(/"/g, "'")}"` : texto;
}

export function componerFrontmatter(meta, cuerpo) {
  const lineas = Object.entries(meta)
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== "")
    .map(([clave, valor]) => `${clave}: ${escribirValor(valor)}`);
  return `${DELIMITADOR}\n${lineas.join("\n")}\n${DELIMITADOR}\n\n${cuerpo.trimStart()}`;
}

/* Campos que toda página declara. `bandas` es una lista porque una misma
   explicación puede servir en dos tramos de edad; `orden` coloca dentro de su
   categoría, que casi nunca es alfabético. */
export const CAMPOS_DE_PAGINA = ["titulo", "materia", "categoria", "descripcion", "bandas", "orden"];

export function validarPagina(pagina, { materias, bandasValidas }) {
  const fallos = [];
  const añadir = (regla, mensaje) => fallos.push({ id: pagina.id ?? "(sin id)", regla, mensaje });

  for (const campo of ["titulo", "materia", "categoria"]) {
    if (!pagina[campo]) añadir("falta-campo", `«${pagina.id}»: falta «${campo}» en el frontmatter`);
  }
  if (pagina.materia && !materias.has(pagina.materia)) {
    añadir("materia-desconocida", `«${pagina.id}»: la materia «${pagina.materia}» no existe`);
  }
  for (const banda of pagina.bandas ?? []) {
    if (!bandasValidas.includes(banda)) {
      añadir("banda-desconocida", `«${pagina.id}»: la banda «${banda}» no existe`);
    }
  }
  return fallos;
}
