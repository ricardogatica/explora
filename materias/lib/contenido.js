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
import { BANDAS, PREVIO, bandaPorId, esBandaDeRuta, IDS_VALIDOS } from "@explora/contenido/bandas.js";

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

  const idsDeLaMateria = paginas.map(p => p.id);
  const fallos = paginas.flatMap(pagina =>
    validarPagina(pagina, { materias: MATERIAS_VALIDAS, bandasValidas: IDS_VALIDOS, idsDeLaMateria })
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
  /* Una pregunta puede decir a qué página pertenece, y eso es lo que hace preciso el
     «repasa esto» cuando se atasca. Si apunta a una página que no existe no se rompe
     nada: simplemente se cae al repaso genérico del tramo anterior, y nadie se entera
     de que la anotación estaba mal escrita. Por eso se comprueba aquí. */
  const paginasMal = archivos.flatMap(({ archivo, preguntas }) =>
    preguntas.filter(p => p.pagina).flatMap(pregunta => {
      const existe = paginasDe(pregunta.materia).some(pagina => pagina.id === pregunta.pagina);
      return existe ? [] : [`${archivo}: «${pregunta.id}» apunta a la página «${pregunta.pagina}», que no existe en ${pregunta.materia}`];
    })
  );
  if (paginasMal.length) {
    throw new Error("Hay preguntas que apuntan a una página inexistente:\n  " + paginasMal.join("\n  "));
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

/* ── El recorrido por edad dentro de una materia ─────────────────────────────

   Elegir la edad, ver lo que toca, practicarlo, y cuando algo se atasca, volver a
   lo de antes. Estas cuatro funciones son ese recorrido. */

/* Lo que hay de una materia en un tramo. */
export const paginasDeMateriaYBanda = (slug, banda) =>
  paginasDe(slug).filter(pagina => (pagina.bandas ?? []).includes(banda));

export const preguntasDeMateriaYBanda = (slug, banda) =>
  preguntasDe(slug).filter(pregunta => pregunta.banda === banda);

/* El tramo anterior. Antes del primero está «previo», que no forma parte de la
   progresión pero sí tiene contenido: dejarlo fuera vaciaría el refuerzo justo en
   la edad donde más se necesita volver atrás. */
export function bandaAnterior(id) {
  const indice = BANDAS.findIndex(banda => banda.id === id);
  if (indice > 0) return BANDAS[indice - 1];
  if (indice === 0) return PREVIO;
  return null;   // «previo» no tiene nada antes
}

/* Qué repasar antes de una página.

   Se declara con `refuerzo` en el frontmatter cuando hace falta afinar, y si no se
   deduce de dos sitios que ya existen: lo anterior de su misma categoría —el campo
   `orden` está puesto en orden pedagógico, no alfabético— y lo mismo un tramo de
   edad más atrás. Deducirlo sale gratis y acierta casi siempre; declararlo cuarenta
   veces a mano para repetir lo que ya se sabe, no. */
const edadDeBanda = id => bandaPorId(id)?.desde ?? Infinity;

export function refuerzoDe(slug, id, { cuantas = 3 } = {}) {
  const paginas = paginasDe(slug);
  const propia = paginas.find(pagina => pagina.id === id);
  if (!propia) return [];

  if (propia.refuerzo?.length) {
    return propia.refuerzo.map(otro => paginas.find(p => p.id === otro)).filter(Boolean);
  }

  /* Reforzar es volver atrás, y «atrás» es en edad, no en la lista.

     La primera versión cogía la página anterior por `orden` dentro de la categoría,
     y eso proponía disparates: para Óptica sugería Electricidad y magnetismo, que es
     del mismo tramo y no tiene nada que ver, y para Potencias sugería Números
     racionales, que es dos años posterior. Solo cuenta lo que está en un tramo más
     temprano. */
  const suEdad = Math.min(...(propia.bandas ?? []).map(edadDeBanda));
  /* Dos tramos hacia atrás como mucho. Reforzar es volver un poco, no al principio:
     a quien se le atascan las potencias a los nueve años no le sirve que le
     propongan la página de los tres. */
  const antes = paginas.filter(p => {
    if (p.id === id || !(p.bandas ?? []).length) return false;
    const suya = Math.min(...p.bandas.map(edadDeBanda));
    return suya < suEdad && suya >= suEdad - 4;
  });

  // Primero lo del mismo tema, después lo demás: lo cercano ayuda más.
  const ordenadas = [
    ...antes.filter(p => p.categoria === propia.categoria),
    ...antes.filter(p => p.categoria !== propia.categoria)
  ].sort((a, b) => Math.min(...b.bandas.map(edadDeBanda)) - Math.min(...a.bandas.map(edadDeBanda)));

  const vistas = new Set();
  return ordenadas
    .filter(p => (vistas.has(p.id) ? false : vistas.add(p.id)))
    .slice(0, cuantas);
}

/* Qué repasar cuando una pregunta se atasca.

   Si la pregunta dice a qué página pertenece, se usa el refuerzo de esa página, que
   es lo preciso. Si no lo dice —y hoy casi ninguna lo dice—, se cae a lo que hay de
   su materia en el tramo anterior: menos fino, pero nunca deja a nadie sin nada a
   lo que volver. */
export function repasoDePregunta(pregunta, { cuantas = 3 } = {}) {
  if (pregunta.pagina) {
    const refuerzo = refuerzoDe(pregunta.materia, pregunta.pagina, { cuantas });
    if (refuerzo.length) return refuerzo;
    const propia = paginasDe(pregunta.materia).find(p => p.id === pregunta.pagina);
    if (propia) return [propia];
  }
  const anterior = bandaAnterior(pregunta.banda);
  if (!anterior) return [];
  return paginasDeMateriaYBanda(pregunta.materia, anterior.id).slice(0, cuantas);
}

/* Las otras páginas del mismo tramo de edad, agrupadas por materia.

   Es lo que convierte una página de nivel —«Nivel 9 a 11 años»— en algo por donde
   se puede seguir: describía el tramo y no llevaba a ninguna parte, así que quien
   entraba tenía que volver atrás y buscar a mano.

   Se resuelve por las bandas del frontmatter y no por el nombre del archivo. Los
   `nivel-*` son de matemáticas y de una época anterior a las bandas; física y
   lenguaje no tienen ninguno, y aun así sus páginas pertenecen a un tramo. Lo que
   define «este tramo» es el dato, no cómo se llama el archivo.

   Una página que está en dos bandas aparece una vez, no dos. */
export function hermanasDeTramo(slug, id, { porMateria: cuantas = 6 } = {}) {
  const propia = paginasDe(slug).find(pagina => pagina.id === id);
  const bandas = propia?.bandas ?? [];
  // Siempre la misma forma: quien lo pinta no tiene que distinguir dos casos.
  if (!bandas.length) return { bandas: [], materias: [] };

  const vistas = new Set([`${slug}/${id}`]);
  const porMateria = MATERIAS.map(materia => ({
    ...materia,
    /* Acotadas: con las cuatro unidades de segundo medio, el tramo de 15-17 tiene
       diecinueve páginas y al pie de cada lección salía un muro de tarjetas. Las
       primeras y un enlace al índice por edad, que es donde están todas. */
    todas: paginasDe(materia.slug).filter(pagina =>
      (pagina.bandas ?? []).some(banda => bandas.includes(banda)) &&
      !(materia.slug === slug && pagina.id === id)
    ).length,
    paginas: paginasDe(materia.slug).filter(pagina => {
      const clave = `${materia.slug}/${pagina.id}`;
      if (vistas.has(clave)) return false;
      if (!(pagina.bandas ?? []).some(banda => bandas.includes(banda))) return false;
      vistas.add(clave);
      return true;
    }).slice(0, cuantas)
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
