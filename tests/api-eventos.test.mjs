import { test } from "node:test";
import assert from "node:assert/strict";
import { validarRespuesta, validarSesion, LARGO_MAXIMO_DE_RESPUESTA } from "../api/dominio/eventos.js";

/* Todo lo que llega a la API viene de un navegador, y el identificador de
   sesión lo genera el propio navegador para que el progreso funcione aunque la
   API esté caída. Eso significa que cualquiera puede mandar cualquier cosa:
   estas pruebas son la puerta. */

const VALIDA = {
  sesion: "8f14e45f-ceea-467a-9d1a-3f2e1c4b5a60",
  materia: "matematicas",
  banda: "9-10",
  familia: "practica",
  pregunta: "mat-9-10-fracciones-01",
  correcta: true,
  ms: 4200
};

test("una respuesta bien formada pasa entera", () => {
  const { evento, errores } = validarRespuesta(VALIDA);
  assert.equal(errores, undefined);
  assert.equal(evento.pregunta, "mat-9-10-fracciones-01");
  assert.equal(evento.correcta, true);
  assert.equal(evento.ms, 4200);
  assert.equal(evento.escrito, null, "sin texto escrito queda nulo, no cadena vacía");
});

test("la observación puede no tener respuesta correcta", () => {
  // No se pregunta si acierta, se pregunta qué ve. Un null aquí es legítimo.
  const { evento, errores } = validarRespuesta({ ...VALIDA, correcta: null });
  assert.equal(errores, undefined);
  assert.equal(evento.correcta, null);
});

test("cada campo del contrato de contenido se comprueba contra el contrato", () => {
  // Y no contra una lista escrita a mano aquí, que se quedaría vieja al añadir
  // una materia.
  for (const [campo, valor] of [["materia", "cocina"], ["banda", "3-4"], ["familia", "examen"]]) {
    const { errores } = validarRespuesta({ ...VALIDA, [campo]: valor });
    assert.ok(errores?.some(e => e.includes(campo)), `«${valor}» debería rechazarse en ${campo}`);
  }
});

test("el id de sesión tiene que ser un uuid de verdad", () => {
  for (const malo of ["", "abc", "8f14e45f-ceea-467a-9d1a", "../../etc/passwd", 42, null]) {
    const { errores } = validarRespuesta({ ...VALIDA, sesion: malo });
    assert.ok(errores?.some(e => e.includes("sesion")), `${JSON.stringify(malo)} debería rechazarse`);
  }
});

test("un cuerpo vacío no revienta: devuelve errores", () => {
  // Nunca lanza. Quien llama decide el código HTTP.
  const { errores } = validarRespuesta(undefined);
  assert.ok(Array.isArray(errores) && errores.length > 0);
});

test("el texto escrito se guarda tal cual, recortado", () => {
  /* Sin normalizar a propósito: la falta de ortografía es el dato. Ver que
     muchos escriben «aver» dice qué explicar mejor; «a ver» no dice nada. */
  const { evento } = validarRespuesta({ ...VALIDA, escrito: "  aver  " });
  assert.equal(evento.escrito, "aver");

  const largo = validarRespuesta({ ...VALIDA, escrito: "a".repeat(500) });
  assert.equal(largo.evento.escrito.length, LARGO_MAXIMO_DE_RESPUESTA,
    "es un campo abierto de texto libre y no hay razón para aceptar más");
});

test("el id de pregunta también se recorta", () => {
  const { evento } = validarRespuesta({ ...VALIDA, pregunta: "x".repeat(500) });
  assert.ok(evento.pregunta.length <= 120);
});

test("ms tiene que ser un entero de milisegundos, si viene", () => {
  assert.equal(validarRespuesta({ ...VALIDA, ms: undefined }).evento.ms, null);
  for (const malo of [-1, 1.5, "4200"]) {
    assert.ok(validarRespuesta({ ...VALIDA, ms: malo }).errores?.some(e => e.includes("ms")));
  }
});

test("la sesión solo acepta el modo que existe hoy", () => {
  /* «Crear cuenta» está anunciado en la interfaz y no implementado. Aceptarlo
     aquí guardaría filas de un modo que todavía no significa nada. */
  const { sesion, errores } = validarSesion({ id: VALIDA.sesion, modo: "local" });
  assert.equal(errores, undefined);
  assert.deepEqual(sesion, { id: VALIDA.sesion, modo: "local" });

  assert.ok(validarSesion({ id: VALIDA.sesion, modo: "cuenta" }).errores?.some(e => e.includes("modo")));
});
