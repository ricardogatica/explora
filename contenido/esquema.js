/* El contrato de contenido de Explora.

   Todas las materias —lenguaje, matemáticas, ciencias naturales, historia,
   biología, física— usan esta misma forma. Es lo que permite que añadir una
   materia sea crear una carpeta y no escribir una aplicación, y lo que sostiene
   la ruta de 5 a 17 años, que cruza todas.

   Por qué está escrito a mano y sin dependencias: el spec proponía Zod, pero en
   esta fase no hay build ni package.json, y las reglas que de verdad importan no
   son de tipos sino de integridad referencial —que la respuesta esté entre las
   opciones, que cada elemento arrastrable tenga destino—. Un validador en ESM
   plano lo cubre, deja el repositorio sin node_modules y sirve igual a los tests
   y, más adelante, al build de la aplicación: una sola definición en vez de un
   esquema y unos tests que lo repiten.

   Devuelve listas de errores en vez de lanzar. Validar 57 preguntas y detenerse
   en la primera obliga a arreglarlas de una en una; verlas todas permite una sola
   pasada. */

import { bandaPorId } from "./bandas.js";

export const MATERIAS = new Set([
  "lenguaje", "matematicas", "ciencias-naturales", "historia", "biologia", "fisica"
]);

export const FAMILIAS = new Set(["practica", "diagnostico"]);

export const TIPOS = new Set([
  "multiple-choice", "fill", "observation", "drag-match", "drag-order"
]);

/* Qué campos exige cada familia además de los comunes.

   Práctica explica por qué la respuesta es la correcta: una pregunta que se
   corrige sin explicar no enseña. Diagnóstico nombra la habilidad que observa y
   devuelve una lectura al adulto, que es para quien está pensado. */
const CAMPOS_DE_FAMILIA = {
  practica: ["categoria", "explicacion"],
  diagnostico: ["habilidad", "retroalimentacion"]
};

const CAMPOS_COMUNES = ["id", "materia", "banda", "familia", "tipo", "pregunta"];

const vacio = valor => valor == null || (typeof valor === "string" && valor.trim() === "");

function error(pregunta, regla, mensaje) {
  return { id: pregunta?.id ?? "(sin id)", regla, mensaje };
}


/* Los elementos arrastrables son {id, etiqueta}: el id es estable y la etiqueta
   es lo que se ve, que puede ser «● ● ●» o un emoji. Separarlos es lo correcto
   —una pregunta puede cambiar cómo se ve sin invalidar su respuesta— y el
   contenido ya lo hacía así; el contrato lo adopta en vez de aplanarlo. */
function idsValidos(lista, añadir, pregunta, campo) {
  const malos = lista.filter(x => !x || typeof x !== "object" || vacio(x.id) || vacio(x.etiqueta));
  if (malos.length) {
    añadir("elemento-mal-formado",
      `«${pregunta.id}»: cada entrada de «${campo}» necesita id y etiqueta`);
    return false;
  }
  const ids = lista.map(x => x.id);
  if (new Set(ids).size !== ids.length) {
    añadir("elemento-mal-formado", `«${pregunta.id}»: «${campo}» repite algún id`);
    return false;
  }
  return true;
}

/* Reglas propias de cada tipo. Son las que fallan en silencio: ninguna produce
   un error al cargar la página, solo un ejercicio que no se puede resolver. */
const REGLAS_POR_TIPO = {
  "multiple-choice"(pregunta, añadir) {
    const opciones = pregunta.opciones;
    if (!Array.isArray(opciones) || opciones.length < 2) {
      añadir("pocas-opciones", `«${pregunta.id}» necesita al menos dos opciones`);
      return;
    }
    if (new Set(opciones).size !== opciones.length) {
      añadir("opciones-repetidas", `«${pregunta.id}» repite alguna opción`);
    }
    if (!opciones.includes(pregunta.respuesta)) {
      añadir("respuesta-fuera-de-opciones",
        `«${pregunta.id}»: la respuesta «${pregunta.respuesta}» no está entre las opciones, ` +
        "así que no hay forma de acertar");
    }
  },

  fill(pregunta, añadir) {
    if (vacio(pregunta.respuesta)) {
      añadir("respuesta-vacia", `«${pregunta.id}» no tiene respuesta`);
    }
    const aceptadas = pregunta.aceptadas ?? [];
    if (aceptadas.includes(pregunta.respuesta)) {
      añadir("aceptadas-repite-respuesta",
        `«${pregunta.id}» repite la respuesta dentro de «aceptadas»`);
    }
  },

  observation(pregunta, añadir) {
    const opciones = pregunta.opciones ?? [], puntaje = pregunta.puntaje ?? {};
    if (opciones.length < 2) {
      añadir("pocas-opciones", `«${pregunta.id}» necesita al menos dos opciones`);
      return;
    }
    for (const opcion of opciones) {
      if (!(opcion in puntaje)) {
        añadir("puntaje-incompleto",
          `«${pregunta.id}»: la opción «${opcion}» no tiene puntaje, así que no se puede corregir`);
      }
    }
    for (const clave of Object.keys(puntaje)) {
      if (!opciones.includes(clave)) {
        añadir("puntaje-sobrante",
          `«${pregunta.id}»: hay puntaje para «${clave}», que no es una opción`);
      }
    }
  },

  "drag-match"(pregunta, añadir) {
    const elementos = pregunta.elementos ?? [], destinos = pregunta.destinos ?? [];
    const respuesta = pregunta.respuesta ?? {};
    if (!elementos.length || !destinos.length) {
      añadir("faltan-elementos", `«${pregunta.id}» necesita elementos y destinos`);
      return;
    }
    if (!idsValidos(elementos, añadir, pregunta, "elementos")) return;
    if (!idsValidos(destinos, añadir, pregunta, "destinos")) return;
    const idsDestino = new Set(destinos.map(d => d.id));
    for (const elemento of elementos) {
      if (!(elemento.id in respuesta)) {
        añadir("elemento-sin-respuesta",
          `«${pregunta.id}»: «${elemento.id}» no tiene destino en la respuesta`);
      }
    }
    for (const [elemento, destino] of Object.entries(respuesta)) {
      if (!idsDestino.has(destino)) {
        añadir("destino-inexistente",
          `«${pregunta.id}»: «${elemento}» apunta a «${destino}», que no es un destino`);
      }
    }
  },

  "drag-order"(pregunta, añadir) {
    const elementos = pregunta.elementos ?? [], respuesta = pregunta.respuesta ?? [];
    if (!elementos.length) {
      añadir("faltan-elementos", `«${pregunta.id}» necesita elementos que ordenar`);
      return;
    }
    if (!idsValidos(elementos, añadir, pregunta, "elementos")) return;
    const ids = new Set(elementos.map(e => e.id));
    if (respuesta.length !== elementos.length) {
      añadir("orden-incompleto",
        `«${pregunta.id}»: la respuesta ordena ${respuesta.length} de ${elementos.length} elementos`);
    }
    for (const elemento of respuesta) {
      if (!ids.has(elemento)) {
        añadir("orden-con-intrusos",
          `«${pregunta.id}»: «${elemento}» está en la respuesta pero no entre los elementos`);
      }
    }
  }
};

export function validarPregunta(pregunta) {
  const fallos = [];
  const añadir = (regla, mensaje) => fallos.push(error(pregunta, regla, mensaje));

  for (const campo of CAMPOS_COMUNES) {
    if (vacio(pregunta?.[campo])) añadir("falta-campo", `falta el campo «${campo}»`);
  }
  if (fallos.length) return fallos;

  if (!MATERIAS.has(pregunta.materia)) {
    añadir("materia-desconocida", `«${pregunta.id}»: la materia «${pregunta.materia}» no existe`);
  }
  if (!bandaPorId(pregunta.banda)) {
    añadir("banda-desconocida",
      `«${pregunta.id}»: la banda «${pregunta.banda}» no existe. Las viejas (nivel-6-8…) ya no valen`);
  }
  if (!FAMILIAS.has(pregunta.familia)) {
    añadir("familia-desconocida", `«${pregunta.id}»: la familia «${pregunta.familia}» no existe`);
  } else {
    for (const campo of CAMPOS_DE_FAMILIA[pregunta.familia]) {
      if (vacio(pregunta[campo])) {
        añadir("falta-campo-de-familia",
          `«${pregunta.id}» es de tipo ${pregunta.familia} y le falta «${campo}»`);
      }
    }
  }
  if (!TIPOS.has(pregunta.tipo)) {
    añadir("tipo-desconocido", `«${pregunta.id}»: el tipo «${pregunta.tipo}» no existe`);
  } else {
    REGLAS_POR_TIPO[pregunta.tipo](pregunta, añadir);
  }
  return fallos;
}

/* Valida varios archivos a la vez. Aparte de las reglas de cada pregunta,
   comprueba lo único que no se puede ver mirando un archivo solo: que ningún
   identificador se repita en todo Explora. La ruta mezcla materias, así que dos
   preguntas con el mismo id harían que una tapara a la otra sin avisar. */
export function validarCorpus(archivos, { contar = false } = {}) {
  const fallos = [];
  const vistos = new Map();
  let revisadas = 0;

  for (const { archivo, preguntas } of archivos) {
    for (const pregunta of preguntas) {
      revisadas++;
      for (const fallo of validarPregunta(pregunta)) {
        fallos.push({ ...fallo, archivo, mensaje: `${archivo}: ${fallo.mensaje}` });
      }
      const previo = vistos.get(pregunta.id);
      if (previo) {
        fallos.push({
          id: pregunta.id, archivo, regla: "id-repetido",
          mensaje: `el identificador «${pregunta.id}» está en ${previo} y en ${archivo}`
        });
      } else {
        vistos.set(pregunta.id, archivo);
      }
    }
  }
  return contar ? { fallos, revisadas } : fallos;
}
