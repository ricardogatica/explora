/* Lector de contenido, en tiempo de build.

   Lee de `contenido/<materia>/`, donde una página es un archivo: su texto y su
   metadata en el mismo sitio. Antes eran dos —el texto en `pages/` y el título
   en un manifiesto— y añadir una página obligaba a escribir en dos lugares;
   olvidarse del segundo la dejaba invisible sin dar ningún error.

   Valida al leer y **rompe el build** si algo no cumple el contrato. Es la
   propiedad que este stack no trae de fábrica: sin ella una pregunta mal formada
   no da ningún error, solo aparece rota delante de un niño. */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import { validarCorpus, MATERIAS as MATERIAS_VALIDAS } from "@explora/contenido/esquema.js";
import { separarFrontmatter, validarPagina } from "@explora/contenido/paginas.js";
import { partirEnBloques } from "@explora/contenido/bloques.js";
import { NOMBRES_DE_FIGURA } from "@explora/compartido/primitivas.js";
import { NOMBRES_DE_ACTIVIDAD } from "../app/actividades/nombres.js";
import { BANDAS, bandaPorId, esBandaDeRuta, IDS_VALIDOS } from "@explora/contenido/bandas.js";

/* En build el proceso corre dentro de materias/, y el contenido es hermano suyo:
   vive fuera de la aplicación a propósito, porque es el activo del proyecto y no
   debe quedar preso de la aplicación que hoy lo pinta. */
const CONTENIDO = join(process.cwd(), "..", "contenido");

export const MATERIAS = [
  {
    slug: "lenguaje",
    nombre: "Lenguaje",
    descripcion: "Ortografía, gramática y redacción del español."
  },
  {
    slug: "matematicas",
    nombre: "Matemáticas",
    descripcion: "Números, geometría, datos y álgebra, por edad."
  },
  {
    slug: "fisica",
    nombre: "Física",
    descripcion: "Fuerzas, energía, calor, luz y electricidad, de los 5 a los 17 años."
  }
];

export function materiaPorSlug(slug) {
  return MATERIAS.find(m => m.slug === slug) ?? null;
}

/* Las páginas de una materia, ordenadas por su campo `orden` —que casi nunca es
   el alfabético— y validadas. Se leen una vez por build. */
const cachePaginas = new Map();

export function paginasDe(slug) {
  if (cachePaginas.has(slug)) return cachePaginas.get(slug);

  const carpeta = join(CONTENIDO, slug, "paginas");
  const paginas = readdirSync(carpeta)
    .filter(nombre => nombre.endsWith(".md"))
    .map(nombre => {
      const id = nombre.replace(/\.md$/, "");
      const { meta, cuerpo, tieneFrontmatter } = separarFrontmatter(
        readFileSync(join(carpeta, nombre), "utf8")
      );
      if (!tieneFrontmatter) {
        throw new Error(`contenido/${slug}/paginas/${nombre} no tiene frontmatter: sin él no se sabe ni su título`);
      }
      return { id, cuerpo, ...meta, orden: Number(meta.orden ?? 9999) };
    })
    .sort((a, b) => a.orden - b.orden);

  const fallos = paginas.flatMap(pagina =>
    validarPagina(pagina, { materias: MATERIAS_VALIDAS, bandasValidas: IDS_VALIDOS })
  );
  if (fallos.length) {
    throw new Error(
      "Hay páginas que no cumplen el contrato y por eso no se publican:\n" +
      fallos.map(f => `  [${f.regla}] ${f.mensaje}`).join("\n")
    );
  }

  cachePaginas.set(slug, paginas);
  return paginas;
}

export function paginaDe(slug, id) {
  const pagina = paginasDe(slug).find(p => p.id === id);
  if (!pagina) return null;

  /* El texto se trocea en bloques: markdown y figuras 3D alternándose. El HTML
     sale de markdown escrito en este repositorio, no de nada que llegue de
     fuera. */
  const bloques = partirEnBloques(pagina.cuerpo).map(bloque =>
    bloque.tipo === "markdown" ? { ...bloque, html: marked.parse(bloque.texto) } : bloque
  );

  /* Una figura o una actividad mal escritas rompen el build en vez de dejar un
     hueco: el nombre se teclea a mano dentro del markdown y equivocarse es
     cuestión de tiempo. */
  for (const bloque of bloques) {
    if (bloque.tipo === "figura" && !NOMBRES_DE_FIGURA.includes(bloque.figura)) {
      throw new Error(
        `contenido/${slug}/paginas/${id}.md pide la figura «${bloque.figura}», que no existe. ` +
        `Las que hay: ${NOMBRES_DE_FIGURA.join(", ")}.`
      );
    }
    if (bloque.tipo === "actividad" && !NOMBRES_DE_ACTIVIDAD.includes(bloque.actividad)) {
      throw new Error(
        `contenido/${slug}/paginas/${id}.md pide la actividad «${bloque.actividad}», que no existe. ` +
        `Las que hay: ${NOMBRES_DE_ACTIVIDAD.join(", ")}.`
      );
    }
  }

  return { ...pagina, bloques };
}

let cachePreguntas = null;

export function todasLasPreguntas() {
  if (cachePreguntas) return cachePreguntas;

  const archivos = MATERIAS.map(materia => ({
    archivo: `contenido/${materia.slug}/preguntas.json`,
    preguntas: JSON.parse(readFileSync(join(CONTENIDO, materia.slug, "preguntas.json"), "utf8"))
  }));

  const fallos = validarCorpus(archivos);
  if (fallos.length) {
    throw new Error(
      "El contenido no cumple el contrato y por eso no se publica:\n" +
      fallos.map(f => `  [${f.regla}] ${f.mensaje}`).join("\n")
    );
  }
  cachePreguntas = archivos.flatMap(a => a.preguntas);
  return cachePreguntas;
}

export const preguntasDe = slug => todasLasPreguntas().filter(p => p.materia === slug);
export const preguntasDeBanda = banda => todasLasPreguntas().filter(p => p.banda === banda);

/* Las páginas de un tramo de edad. Una página puede estar en varios: la misma
   explicación de la tilde diacrítica sirve a los 11 y a los 12. */
export const paginasDeBanda = banda =>
  MATERIAS.flatMap(materia => paginasDe(materia.slug)).filter(p => (p.bandas ?? []).includes(banda));

/* Las otras páginas del mismo tramo de edad, agrupadas por materia.

   Es lo que convierte una página de nivel —«Nivel 9 a 11 años»— en algo por donde
   se puede seguir: describía el tramo y no llevaba a ninguna parte, así que quien
   entraba tenía que volver atrás y buscar a mano.

   Se resuelve por las bandas del frontmatter y no por el nombre del archivo. Los
   `nivel-*` son de matemáticas y de una época anterior a las bandas; física y
   lenguaje no tienen ninguno, y aun así sus páginas pertenecen a un tramo. Lo que
   define «este tramo» es el dato, no cómo se llama el archivo.

   Una página que está en dos bandas aparece una vez, no dos. */
export function hermanasDeTramo(slug, id) {
  const propia = paginasDe(slug).find(pagina => pagina.id === id);
  const bandas = propia?.bandas ?? [];
  // Siempre la misma forma: quien lo pinta no tiene que distinguir dos casos.
  if (!bandas.length) return { bandas: [], materias: [] };

  const vistas = new Set([`${slug}/${id}`]);
  const porMateria = MATERIAS.map(materia => ({
    ...materia,
    paginas: paginasDe(materia.slug).filter(pagina => {
      const clave = `${materia.slug}/${pagina.id}`;
      if (vistas.has(clave)) return false;
      if (!(pagina.bandas ?? []).some(banda => bandas.includes(banda))) return false;
      vistas.add(clave);
      return true;
    })
  })).filter(materia => materia.paginas.length > 0);

  /* Solo los tramos de la ruta tienen página propia; «previo» no está en la
     progresión y enlazar a /ruta/previo/ daría un 404. */
  return { bandas: bandas.filter(esBandaDeRuta).map(bandaPorId), materias: porMateria };
}

/* La ruta de aprendizaje: qué hay en cada tramo, atravesando materias. Se arma
   por banda y no por asignatura porque es lo que recorre quien acompaña. */
export function ruta() {
  return BANDAS.map(banda => {
    const preguntas = preguntasDeBanda(banda.id);
    const paginas = paginasDeBanda(banda.id);
    return {
      ...banda,
      total: preguntas.length,
      paginas,
      materias: MATERIAS.map(materia => ({
        ...materia,
        preguntas: preguntas.filter(p => p.materia === materia.slug),
        paginas: paginas.filter(p => p.materia === materia.slug)
      })).filter(m => m.preguntas.length > 0 || m.paginas.length > 0)
    };
  });
}

export const bandaDetalle = id => (bandaPorId(id) ? ruta().find(b => b.id === id) ?? null : null);
