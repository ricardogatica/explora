"use client";

/* La sesión local: quién es este navegador y qué lleva hecho.

   Dos ideas que conviene no mezclar:

   - El progreso que se ve vive AQUÍ, en el navegador. Es la fuente de verdad
     de lo que la interfaz pinta, y por eso practicar funciona con la API
     caída, sin red o en un avión.
   - La base de datos guarda una copia de cada respuesta para poder mirar qué
     preguntas falla todo el mundo y arreglar el contenido. No es de donde se
     lee: es de donde se aprende.

   De ahí la consecuencia que la interfaz anuncia sin letra pequeña: si se
   pierde este navegador, se pierde el progreso. Lo que ya se envió sigue
   sirviendo para las estadísticas, pero no hay forma de devolvérselo a nadie,
   porque no sabemos quién es nadie. */

const CLAVE_MODO = "explora.modo";
const CLAVE_SESION = "explora.sesion";
const CLAVE_PROGRESO = "explora.progreso";

export const MODO_LOCAL = "local";

/* Todo pasa por aquí porque en Next el primer render ocurre sin navegador
   —las páginas se generan como archivos— y tocar localStorage ahí revienta. */
const hayNavegador = () => typeof window !== "undefined";

function leer(clave, porDefecto = null) {
  if (!hayNavegador()) return porDefecto;
  try {
    const bruto = localStorage.getItem(clave);
    return bruto === null ? porDefecto : JSON.parse(bruto);
  } catch {
    /* Un localStorage lleno, en modo privado o con basura de una versión
       anterior no puede impedir que alguien practique. */
    return porDefecto;
  }
}

function escribir(clave, valor) {
  if (!hayNavegador()) return;
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Ídem: guardar es deseable, no imprescindible.
  }
}

export const modoElegido = () => leer(CLAVE_MODO);

/* El id lo genera el navegador y no el servidor: así existe desde el primer
   segundo, sin pedir permiso a nadie y sin depender de que la API responda. Es
   aleatorio y no lleva nada dentro; no identifica a una persona, identifica a
   un navegador. */
export function idDeSesion() {
  let id = leer(CLAVE_SESION);
  if (typeof id !== "string") {
    id = crypto.randomUUID();
    escribir(CLAVE_SESION, id);
  }
  return id;
}

export function elegirModo(modo) {
  escribir(CLAVE_MODO, modo);
  if (modo !== MODO_LOCAL) return;
  const id = idDeSesion();
  enviar("/api/sesiones", { id, modo });
}

/* Fuego y olvido, con la promesa consumida: guardar una estadística no puede
   hacer esperar a quien está respondiendo, ni ensuciarle la consola cuando la
   API no está levantada —que en desarrollo es lo normal—. */
function enviar(ruta, cuerpo) {
  if (!hayNavegador()) return;
  fetch(ruta, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(cuerpo),
    keepalive: true
  }).catch(() => {});
}

/* Se llama al revisar cada pregunta. Dos efectos separados: apuntar el
   resultado en el navegador, que es lo que se verá, y mandar la copia. */
export function anotarRespuesta({ materia, banda, familia, pregunta, correcta, escrito, ms }) {
  /* Sin modo elegido no se guarda nada, tampoco en el navegador. Quien cerró el
     modal sin responder no dijo que sí a que le guardásemos el progreso, y
     hacerlo igualmente «porque total, es su dispositivo» es contestar por él.
     Puede practicar, y no se apunta. */
  if (modoElegido() === null) return;

  const progreso = leer(CLAVE_PROGRESO, {});
  const clave = `${materia}/${banda}`;
  const anterior = progreso[clave] ?? { respondidas: 0, aciertos: 0, preguntas: {} };

  /* Por id de pregunta y no un contador suelto: si alguien repite la misma
     práctica, «12 de 20» tiene que seguir siendo «de 20» y no crecer sin
     techo. Se queda el último intento. */
  const yaEstaba = anterior.preguntas[pregunta];
  anterior.preguntas[pregunta] = correcta;
  anterior.respondidas = Object.keys(anterior.preguntas).length;
  anterior.aciertos = Object.values(anterior.preguntas).filter(Boolean).length;
  anterior.ultima = new Date().toISOString();
  if (yaEstaba !== undefined) anterior.repetidas = (anterior.repetidas ?? 0) + 1;

  progreso[clave] = anterior;
  escribir(CLAVE_PROGRESO, progreso);

  enviar("/api/respuestas", {
    sesion: idDeSesion(), materia, banda, familia, pregunta, correcta, escrito, ms
  });
}

export const progresoDe = (materia, banda) =>
  leer(CLAVE_PROGRESO, {})[`${materia}/${banda}`] ?? null;

export const progresoCompleto = () => leer(CLAVE_PROGRESO, {});
