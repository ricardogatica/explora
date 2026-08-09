import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizar, esCorrecta, puntaje, puntajeMaximo } from "../contenido/corregir.js";

test("la tilde cuenta: es lo que se está preguntando", () => {
  /* En lenguaje, aceptar «cancion» por «canción» enseñaría exactamente lo
     contrario de lo que pretende el ejercicio. Es la regla que hay que proteger
     de cualquier «normalización» bienintencionada. */
  const pregunta = { tipo: "fill", respuesta: "canción" };
  assert.equal(esCorrecta(pregunta, "canción"), true);
  assert.equal(esCorrecta(pregunta, "cancion"), false);
  assert.equal(esCorrecta(pregunta, "canciòn"), false);
});

test("se perdona lo que es ruido de tecleo, no la respuesta", () => {
  const pregunta = { tipo: "fill", respuesta: "Tú tienes tu cuaderno." };
  assert.equal(esCorrecta(pregunta, "tú tienes tu cuaderno."), true, "mayúsculas");
  assert.equal(esCorrecta(pregunta, "  Tú   tienes tu cuaderno.  "), true, "espacios");
  assert.equal(esCorrecta(pregunta, "Tú tiene tu cuaderno."), false, "eso ya es otra cosa");
});

test("la coma y el punto decimal son el mismo número", () => {
  // En Chile se escribe 3,5 y el teclado numérico pone 3.5.
  const pregunta = { tipo: "fill", respuesta: "3.5" };
  assert.equal(esCorrecta(pregunta, "3,5"), true);
  assert.equal(esCorrecta(pregunta, "3.5"), true);
  assert.equal(esCorrecta(pregunta, "35"), false);
});

test("las respuestas aceptadas alternativas valen", () => {
  const pregunta = { tipo: "fill", respuesta: "1/2", aceptadas: ["0.5", "un medio"] };
  for (const valida of ["1/2", "0.5", "0,5", "Un Medio"]) {
    assert.equal(esCorrecta(pregunta, valida), true, `debería aceptar «${valida}»`);
  }
  assert.equal(esCorrecta(pregunta, "2/4"), false, "equivalente en matemáticas, pero no es lo pedido");
});

test("opción múltiple compara tal cual, sin normalizar", () => {
  /* Las opciones se eligen pulsando, no escribiendo: no hay ruido de tecleo que
     perdonar, y normalizar aquí haría iguales dos opciones que el ejercicio
     presenta como distintas. En «cancion / canción» eso sería fatal. */
  const pregunta = { tipo: "multiple-choice", opciones: ["cancion", "canción"], respuesta: "canción" };
  assert.equal(esCorrecta(pregunta, "canción"), true);
  assert.equal(esCorrecta(pregunta, "cancion"), false);
});

test("las observaciones no se corrigen: se anotan", () => {
  /* Un diagnóstico por observación no tiene acierto ni error. Devolver `false`
     en vez de `null` haría que la interfaz pintara de rojo a un niño de tres
     años por algo que no era una prueba. */
  const pregunta = {
    tipo: "observation", opciones: ["Sí", "A veces", "No"],
    puntaje: { "Sí": 2, "A veces": 1, "No": 0 }
  };
  assert.equal(esCorrecta(pregunta, "Sí"), null);
  assert.equal(esCorrecta(pregunta, "No"), null);
  assert.equal(puntaje(pregunta, "A veces"), 1);
  assert.equal(puntaje(pregunta, "Sí"), 2);
  assert.equal(puntaje(pregunta, "loquesea"), 0);
  assert.equal(puntajeMaximo(pregunta), 2);
});

test("emparejar exige todas las parejas, no solo las acertadas", () => {
  const pregunta = {
    tipo: "drag-match",
    respuesta: { pelota: "juguetes", galleta: "comida" }
  };
  assert.equal(esCorrecta(pregunta, { pelota: "juguetes", galleta: "comida" }), true);
  assert.equal(esCorrecta(pregunta, { pelota: "juguetes" }), false, "a medias no es correcto");
  assert.equal(esCorrecta(pregunta, { pelota: "comida", galleta: "juguetes" }), false);
  assert.equal(esCorrecta(pregunta, {}), false);
  assert.equal(esCorrecta(pregunta, null), false, "sin responder no revienta");
});

test("ordenar exige el orden, no el conjunto", () => {
  const pregunta = { tipo: "drag-order", respuesta: ["18", "25", "36", "42"] };
  assert.equal(esCorrecta(pregunta, ["18", "25", "36", "42"]), true);
  assert.equal(esCorrecta(pregunta, ["25", "18", "36", "42"]), false);
  assert.equal(esCorrecta(pregunta, ["18", "25", "36"]), false);
  assert.equal(esCorrecta(pregunta, null), false);
});

test("normalizar no toca las tildes ni la ñ", () => {
  assert.equal(normalizar("  Año   NUEVO "), "año nuevo");
  assert.notEqual(normalizar("año"), normalizar("ano"));
});

test("el corpus real se puede corregir entero sin reventar", async () => {
  /* Recorre las 57 preguntas dándoles su propia respuesta correcta: si algún
     tipo no está contemplado en el corrector, aquí se ve. */
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const { traducirPractica, traducirDiagnostico } = await import("../contenido/legado.js");

  const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
  const leer = ruta => JSON.parse(readFileSync(join(raiz, ruta), "utf8"));
  const preguntas = [
    ...leer("matematicas/data/practice.json").map(p => traducirPractica(p, "matematicas")),
    ...leer("matematicas/data/diagnostics.json").map(p => traducirDiagnostico(p, "matematicas")),
    ...leer("lenguaje/data/exercises.json").map(p => traducirPractica(p, "lenguaje"))
  ];

  let corregibles = 0;
  for (const pregunta of preguntas) {
    if (pregunta.tipo === "observation") {
      assert.equal(esCorrecta(pregunta, pregunta.opciones[0]), null);
      continue;
    }
    corregibles++;
    assert.equal(
      esCorrecta(pregunta, pregunta.respuesta), true,
      `«${pregunta.id}» (${pregunta.tipo}) no se acepta a sí misma como correcta`
    );
  }
  assert.ok(corregibles >= 45, `esperaba al menos 45 preguntas corregibles, hubo ${corregibles}`);
});
