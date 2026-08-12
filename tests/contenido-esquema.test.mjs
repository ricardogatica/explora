import { test } from "node:test";
import assert from "node:assert/strict";
import { validarPregunta, validarCorpus, TIPOS, FAMILIAS } from "../contenido/esquema.js";

/* El validador existe porque este stack no trae validación de contenido: en Nuxt
   Content el esquema revienta el build, y aquí hay que ponerlo a mano. Sin él,
   una pregunta mal formada no da ningún error: simplemente aparece rota delante
   de un niño.

   Los tests son casos inválidos, uno por regla. Lo que se comprueba no es solo
   que el validador diga «no», sino que diga QUÉ id y QUÉ regla: un validador que
   responde «hay 3 errores» obliga a buscarlos a mano entre 57 archivos. */

const BASE = {
  id: "x-1", materia: "lenguaje", banda: "10-11", familia: "practica",
  tipo: "multiple-choice", pregunta: "¿Cuál lleva tilde?",
  opciones: ["cancion", "canción"], respuesta: "canción",
  categoria: "Acentuación", explicacion: "Aguda terminada en n."
};

const errores = pregunta => validarPregunta(pregunta).map(e => e.regla);

test("una pregunta bien formada no da errores", () => {
  assert.deepEqual(validarPregunta(BASE), []);
});

test("los campos obligatorios se exigen y se nombran", () => {
  for (const campo of ["id", "materia", "banda", "tipo", "pregunta"]) {
    const rota = { ...BASE };
    delete rota[campo];
    const fallos = validarPregunta(rota);
    assert.ok(fallos.length > 0, `falta ${campo} y el validador no dice nada`);
    assert.ok(
      fallos.some(e => e.mensaje.includes(campo)),
      `el error por falta de ${campo} no menciona el campo: ${JSON.stringify(fallos)}`
    );
  }
});

test("la banda tiene que existir", () => {
  assert.ok(errores({ ...BASE, banda: "nivel-9-11" }).includes("banda-desconocida"),
    "los identificadores de bandas viejos ya no valen");
  assert.ok(errores({ ...BASE, banda: "18-20" }).includes("banda-desconocida"));
  assert.deepEqual(errores({ ...BASE, banda: "4-5" }), [],
    "previo es una banda válida aunque quede fuera de la ruta");
});

test("la materia y el tipo tienen que ser conocidos", () => {
  assert.ok(errores({ ...BASE, materia: "alquimia" }).includes("materia-desconocida"));
  assert.ok(errores({ ...BASE, tipo: "adivinanza" }).includes("tipo-desconocido"));
});

test("opción múltiple: la respuesta tiene que estar entre las opciones", () => {
  /* Este es el error que nadie ve hasta que alguien intenta acertar. Con
     `answer` fuera de `options` no hay ninguna respuesta correcta posible. */
  const fallos = validarPregunta({ ...BASE, respuesta: "canciòn " });
  assert.ok(fallos.some(e => e.regla === "respuesta-fuera-de-opciones"));
  assert.ok(fallos[0].mensaje.includes("x-1"), "el error tiene que decir de qué pregunta habla");
});

test("opción múltiple: hacen falta al menos dos opciones y sin repetir", () => {
  assert.ok(errores({ ...BASE, opciones: ["canción"] }).includes("pocas-opciones"));
  assert.ok(errores({ ...BASE, opciones: ["canción", "canción"] }).includes("opciones-repetidas"));
});

test("completar: respuesta no vacía y `aceptadas` que aporten algo", () => {
  const completar = {
    id: "f-1", materia: "matematicas", banda: "8-9", familia: "practica",
    tipo: "fill", pregunta: "45 + 36 =", respuesta: "81",
    categoria: "Suma", explicacion: "Se suman decenas y unidades."
  };
  assert.deepEqual(validarPregunta(completar), []);
  assert.ok(errores({ ...completar, respuesta: "  " }).includes("respuesta-vacia"));
  assert.ok(errores({ ...completar, aceptadas: ["81"] }).includes("aceptadas-repite-respuesta"),
    "repetir la respuesta en `aceptadas` no aporta y esconde un descuido");
});

test("observación: los puntajes cubren exactamente las opciones", () => {
  const observacion = {
    id: "o-1", materia: "matematicas", banda: "4-5", familia: "diagnostico",
    tipo: "observation", habilidad: "Cantidad inicial",
    pregunta: "¿Puede entregar solo un objeto?",
    opciones: ["Sí", "No"], puntaje: { "Sí": 2, "No": 0 },
    retroalimentacion: "Muestra comprensión de la unidad."
  };
  assert.deepEqual(validarPregunta(observacion), []);
  assert.ok(errores({ ...observacion, puntaje: { "Sí": 2 } }).includes("puntaje-incompleto"),
    "una opción sin puntaje no se puede corregir");
  assert.ok(errores({ ...observacion, puntaje: { "Sí": 2, "No": 0, "Quizá": 1 } })
    .includes("puntaje-sobrante"), "un puntaje sin opción es una opción que se borró y quedó suelta");
});

test("arrastrar y emparejar: cada elemento va a un destino que existe", () => {
  const emparejar = {
    id: "m-1", materia: "matematicas", banda: "6-7", familia: "diagnostico",
    tipo: "drag-match", habilidad: "Clasificación",
    pregunta: "Arrastra cada objeto a su caja.",
    /* Los arrastrables llevan id y etiqueta por separado: la etiqueta puede ser
       «● ● ●» o un emoji, y el id es lo que la respuesta referencia. Lo aprendí
       del contenido real, que ya lo hacía así mientras el esquema suponía
       cadenas sueltas. */
    elementos: [{ id: "pelota", etiqueta: "Pelota" }, { id: "galleta", etiqueta: "Galleta" }],
    destinos: [{ id: "juguetes", etiqueta: "Juguetes" }, { id: "comida", etiqueta: "Comida" }],
    respuesta: { pelota: "juguetes", galleta: "comida" },
    retroalimentacion: "Clasifica por uso."
  };
  assert.deepEqual(validarPregunta(emparejar), []);
  assert.ok(errores({ ...emparejar, respuesta: { pelota: "juguetes" } })
    .includes("elemento-sin-respuesta"), "un elemento sin destino no se puede resolver");
  assert.ok(errores({ ...emparejar, respuesta: { pelota: "juguetes", galleta: "ropa" } })
    .includes("destino-inexistente"));
  assert.ok(errores({ ...emparejar, elementos: ["pelota", "galleta"] })
    .includes("elemento-mal-formado"), "una cadena suelta no sirve: hace falta id y etiqueta");
  assert.ok(errores({ ...emparejar, destinos: [{ id: "juguetes", etiqueta: "A" }, { id: "juguetes", etiqueta: "B" }] })
    .includes("elemento-mal-formado"), "dos destinos con el mismo id son ambiguos");
});

test("arrastrar y ordenar: la respuesta es una permutación de los elementos", () => {
  const ordenar = {
    id: "r-1", materia: "matematicas", banda: "8-9", familia: "diagnostico",
    tipo: "drag-order", habilidad: "Orden",
    pregunta: "Ordena de menor a mayor.",
    elementos: [{ id: "25", etiqueta: "25" }, { id: "18", etiqueta: "18" }, { id: "36", etiqueta: "36" }],
    respuesta: ["18", "25", "36"],
    retroalimentacion: "Compara decenas primero."
  };
  assert.deepEqual(validarPregunta(ordenar), []);
  assert.ok(errores({ ...ordenar, respuesta: ["18", "25"] }).includes("orden-incompleto"));
  assert.ok(errores({ ...ordenar, respuesta: ["18", "25", "99"] }).includes("orden-con-intrusos"));
});

test("cada familia exige sus campos", () => {
  // Práctica explica por qué; diagnóstico dice qué habilidad mide. Sin eso, una
  // pregunta corregida no enseña nada y una observación no se puede interpretar.
  const sinExplicacion = { ...BASE };
  delete sinExplicacion.explicacion;
  assert.ok(errores(sinExplicacion).includes("falta-campo-de-familia"));

  const diagnosticoSinHabilidad = {
    ...BASE, familia: "diagnostico", retroalimentacion: "Bien."
  };
  delete diagnosticoSinHabilidad.categoria;
  delete diagnosticoSinHabilidad.explicacion;
  assert.ok(errores(diagnosticoSinHabilidad).includes("falta-campo-de-familia"));
});

test("el corpus entero detecta identificadores repetidos entre archivos", () => {
  /* Los ids son únicos en todo Explora, no dentro de cada archivo: la ruta
     mezcla materias, y dos preguntas con el mismo id harían que una tapara a la
     otra sin avisar. */
  const fallos = validarCorpus([
    { archivo: "lenguaje.json", preguntas: [BASE] },
    { archivo: "matematicas.json", preguntas: [{ ...BASE, materia: "matematicas" }] }
  ]);
  const repetidos = fallos.filter(e => e.regla === "id-repetido");
  assert.equal(repetidos.length, 1);
  assert.ok(repetidos[0].mensaje.includes("lenguaje.json"), "debe decir dónde está el otro");
  assert.ok(repetidos[0].mensaje.includes("matematicas.json"));
});

test("el validador cuenta lo que revisó, para no pasar en vacío", () => {
  // Un validador que recorre cero preguntas también devuelve cero errores.
  const { revisadas } = validarCorpus([{ archivo: "a.json", preguntas: [BASE] }], { contar: true });
  assert.equal(revisadas, 1);
});

test("los tipos y familias declarados son los que se usan", () => {
  assert.deepEqual([...TIPOS].sort(),
    ["drag-match", "drag-order", "fill", "multiple-choice", "observation"]);
  assert.deepEqual([...FAMILIAS].sort(), ["diagnostico", "practica"]);
});
