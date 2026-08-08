/* Puente entre el contenido que existe y el contrato nuevo.

   Los tres archivos actuales —practice.json, diagnostics.json y exercises.json—
   usan nombres en inglés (`category`, `answer`, `level`) y los leen las dos
   aplicaciones que hoy están en producción. Reescribirlos ahora las rompería, y
   una de las restricciones del plan es que cada fase deje el sitio funcionando.

   Así que en esta fase no se toca ni un archivo: este módulo los lee y los
   presenta con la forma del contrato, de modo que el validador puede comprobar el
   contenido REAL desde el primer día. En la fase 2, cuando las aplicaciones
   viejas desaparezcan, se ejecuta esta misma traducción una vez, se escriben los
   archivos definitivos y este módulo se borra.

   Ese es el motivo de que exista: no es una capa de compatibilidad para siempre,
   es el guion de una migración que todavía no se puede ejecutar. */

import { BANDAS, PREVIO } from "./bandas.js";
import { BANDA_POR_NIVEL_VIEJO, BANDA_POR_CATEGORIA_DE_LENGUAJE } from "./migracion-niveles.js";

/* Los nombres de campo cambian de inglés a español porque el contenido, las
   materias y quienes lo escriben están en español, y tener la mitad del modelo
   en cada idioma es cómo se cuelan los errores de tecleo que nadie ve. */
function comunes(cruda, materia, banda, familia) {
  return {
    id: cruda.id,
    materia,
    banda,
    familia,
    tipo: cruda.type,
    pregunta: cruda.question
  };
}

/* {id, label} pasa a {id, etiqueta}: mismo modelo, el nombre en español como el
   resto del contrato. */
const conEtiqueta = ({ id, label }) => ({ id, etiqueta: label });

function porTipo(cruda) {
  switch (cruda.type) {
    case "multiple-choice":
      return { opciones: cruda.options, respuesta: cruda.answer };
    case "fill":
      return { respuesta: cruda.answer, ...(cruda.accepted ? { aceptadas: cruda.accepted } : {}) };
    case "observation":
      return { opciones: cruda.options, puntaje: cruda.score };
    case "drag-match":
      return {
        elementos: cruda.items.map(conEtiqueta), destinos: cruda.targets.map(conEtiqueta),
        respuesta: cruda.answer, ...(cruda.hint ? { pista: cruda.hint } : {})
      };
    case "drag-order":
      return {
        elementos: cruda.items.map(conEtiqueta), respuesta: cruda.answer,
        ...(cruda.hint ? { pista: cruda.hint } : {})
      };
    default:
      return {};
  }
}

/* Los `accepted` del contenido viejo a veces repiten la respuesta. Es inofensivo
   ahí y el contrato lo prohíbe, porque esconde un descuido: se limpian al
   traducir en lugar de relajar la regla. */
function limpiarAceptadas(traducida) {
  if (!traducida.aceptadas) return traducida;
  const aceptadas = traducida.aceptadas.filter(valor => valor !== traducida.respuesta);
  return aceptadas.length ? { ...traducida, aceptadas } : (delete traducida.aceptadas, traducida);
}

export function traducirPractica(cruda, materia) {
  const banda = cruda.level
    ? BANDA_POR_NIVEL_VIEJO[cruda.level]
    : BANDA_POR_CATEGORIA_DE_LENGUAJE[cruda.category];
  return limpiarAceptadas({
    ...comunes(cruda, materia, banda ?? null, "practica"),
    categoria: cruda.category,
    explicacion: cruda.explanation,
    ...porTipo(cruda)
  });
}

export function traducirDiagnostico(cruda, materia) {
  return limpiarAceptadas({
    ...comunes(cruda, materia, BANDA_POR_NIVEL_VIEJO[cruda.level] ?? null, "diagnostico"),
    habilidad: cruda.skill,
    retroalimentacion: cruda.feedback,
    ...porTipo(cruda)
  });
}

export const IDS_DE_BANDA = [...BANDAS.map(b => b.id), PREVIO.id];
