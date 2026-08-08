/* Lector de contenido, en tiempo de build.

   Lee las páginas y las preguntas DONDE ESTÁN HOY, no donde acabarán. Los dos
   sitios anteriores siguen en pie leyendo esos mismos archivos, y copiarlos aquí
   dejaría dos verdades que se separan en cuanto alguien edite una. El traslado a
   `contenido/<materia>/` ocurre cuando esos sitios se borren, y entonces solo
   cambia este archivo.

   Valida al leer y **rompe el build** si algo no cumple el contrato. Es la
   propiedad que este stack no trae de fábrica: sin ella una pregunta mal formada
   no da ningún error, solo aparece rota delante de un niño. Vale la pena que el
   build falle en vez de publicarla. */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import { validarCorpus } from "@explora/contenido/esquema.js";
import { traducirPractica, traducirDiagnostico } from "@explora/contenido/legado.js";
import { BANDAS, bandaPorId } from "@explora/contenido/bandas.js";

/* El contrato se importa como paquete del workspace y no con rutas relativas
   hacia arriba: el empaquetador de Next no resuelve por encima de la raíz de la
   app, y pelearse con su configuración para lograrlo sería tapar que esto es un
   monorepo. Como paquete, el día que el sistema solar necesite lo mismo lo
   declara igual. */

/* En build, el proceso corre dentro de materias/. La raíz del repositorio es su
   carpeta madre, y de ahí cuelgan las materias viejas. */
const RAIZ = join(process.cwd(), "..");

export const MATERIAS = [
  {
    slug: "lenguaje",
    nombre: "Lenguaje",
    descripcion: "Ortografía, gramática y redacción del español.",
    carpeta: "lenguaje",
    fuentes: [{ archivo: "data/exercises.json", familia: "practica" }]
  },
  {
    slug: "matematicas",
    nombre: "Matemáticas",
    descripcion: "Números, geometría, datos y álgebra, por edad.",
    carpeta: "matematicas",
    fuentes: [
      { archivo: "data/practice.json", familia: "practica" },
      { archivo: "data/diagnostics.json", familia: "diagnostico" }
    ]
  }
];

const leerJSON = ruta => JSON.parse(readFileSync(join(RAIZ, ruta), "utf8"));

export function materiaPorSlug(slug) {
  return MATERIAS.find(m => m.slug === slug) ?? null;
}

/* La metadata de las páginas vive en manifest.json y el texto en pages/*.md: las
   páginas no llevan frontmatter. Al trasladar el contenido se fusionarán en un
   solo archivo, que es donde debería estar; por ahora se juntan al leer. */
export function paginasDe(slug) {
  const materia = materiaPorSlug(slug);
  return leerJSON(`${materia.carpeta}/data/manifest.json`).map(entrada => ({
    id: entrada.id,
    titulo: entrada.title,
    categoria: entrada.category,
    descripcion: entrada.description,
    materia: slug
  }));
}

export function paginaDe(slug, id) {
  const meta = paginasDe(slug).find(p => p.id === id);
  if (!meta) return null;
  const materia = materiaPorSlug(slug);
  const markdown = readFileSync(join(RAIZ, materia.carpeta, "pages", `${id}.md`), "utf8");
  /* El HTML sale de markdown escrito en este repositorio, no de nada que llegue
     de fuera: no hay entrada de usuario en este camino. */
  return { ...meta, html: marked.parse(markdown) };
}

/* Todas las preguntas, ya en la forma del contrato y validadas de una vez. Se
   calcula una sola vez por build: cada ruta de Next lo pediría si no. */
let cache = null;

export function todasLasPreguntas() {
  if (cache) return cache;

  const archivos = MATERIAS.flatMap(materia =>
    materia.fuentes.map(fuente => {
      const crudas = leerJSON(`${materia.carpeta}/${fuente.archivo}`);
      const traducir = fuente.familia === "diagnostico" ? traducirDiagnostico : traducirPractica;
      return {
        archivo: `${materia.carpeta}/${fuente.archivo}`,
        preguntas: crudas.map(cruda => traducir(cruda, materia.slug))
      };
    })
  );

  const fallos = validarCorpus(archivos);
  if (fallos.length) {
    throw new Error(
      `El contenido no cumple el contrato y por eso no se publica:\n` +
      fallos.map(f => `  [${f.regla}] ${f.mensaje}`).join("\n")
    );
  }
  cache = archivos.flatMap(a => a.preguntas);
  return cache;
}

export const preguntasDe = slug => todasLasPreguntas().filter(p => p.materia === slug);
export const preguntasDeBanda = banda => todasLasPreguntas().filter(p => p.banda === banda);

/* La ruta de aprendizaje: qué hay en cada tramo de edad, atravesando materias.
   Es lo que un adulto recorre para acompañar, así que se arma por banda y no por
   asignatura. */
export function ruta() {
  return BANDAS.map(banda => {
    const preguntas = preguntasDeBanda(banda.id);
    return {
      ...banda,
      total: preguntas.length,
      materias: MATERIAS.map(materia => ({
        ...materia,
        preguntas: preguntas.filter(p => p.materia === materia.slug)
      })).filter(m => m.preguntas.length > 0)
    };
  });
}

export const bandaDetalle = id => (bandaPorId(id) ? ruta().find(b => b.id === id) ?? null : null);
