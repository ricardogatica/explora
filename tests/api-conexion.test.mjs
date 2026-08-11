import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { revisarDatabaseUrl } from "../api/dominio/conexion.js";

const BUENA = "postgresql://postgres:secreta@postgres.railway.internal:5432/railway";

test("una cadena buena pasa sin decir nada", () => {
  assert.equal(revisarDatabaseUrl(BUENA), null);
  assert.equal(revisarDatabaseUrl("postgres://usuario:clave@localhost:5432/explora"), null);
  assert.equal(revisarDatabaseUrl(`  ${BUENA}  `), null, "los espacios de los lados no son un problema");
});

test("sin variable, se dice dónde se pone", () => {
  for (const vacia of [undefined, null, "", "   "]) {
    const problema = revisarDatabaseUrl(vacia);
    assert.match(problema, /Falta DATABASE_URL/);
    assert.match(problema, /Postgres\.DATABASE_URL/, "no basta con decir que falta: hay que decir qué poner");
  }
});

test("la llave de más se reconoce, que es para lo que existe esto", () => {
  /* El caso real: la referencia de Railway con dos llaves de sobra al cerrar se
     resuelve, pero deja «}}» pegado al nombre de la base. Postgres responde que
     la base «railway}}» no existe, y eso manda a crear una base que no falta. */
  const problema = revisarDatabaseUrl(`${BUENA}}}`);
  assert.match(problema, /llaves/);
  assert.match(problema, /una llave de más/, "hay que nombrar la causa, no solo el síntoma");
});

test("una referencia sin sustituir también se reconoce", () => {
  const problema = revisarDatabaseUrl("${{Postgres.DATABASE_URL}}");
  assert.ok(problema, "una referencia literal no sirve para conectar");
  assert.match(problema, /llaves/);
});

test("el mensaje no publica la contraseña", () => {
  /* Los registros de la plataforma los ve todo el equipo, y este mensaje sale
     justo cuando alguien está pegando credenciales. */
  const problema = revisarDatabaseUrl(`${BUENA}}}`);
  assert.doesNotMatch(problema, /secreta/, "la contraseña se ha colado en el mensaje");
  assert.match(problema, /…@/, "debería quedar reconocible aunque se tape la clave");
});

test("el mensaje no crece sin límite", () => {
  // Una cadena enorme mal pegada no debería llenar los registros.
  const problema = revisarDatabaseUrl(`postgresql://u:p@host:5432/${"x".repeat(500)}}}`);
  assert.ok(problema.length < 400, `el mensaje mide ${problema.length}`);
});

test("otro protocolo se avisa por su nombre", () => {
  const problema = revisarDatabaseUrl("mysql://usuario:clave@localhost:3306/explora");
  assert.match(problema, /postgres/);
});

test("la comprobación corre antes de conectar", () => {
  /* Si se revisara después, el error de Postgres llegaría primero y este mensaje
     no se vería nunca: es justo el fallo que se quiere explicar. */
  const fuente = new URL("../api/src/base-de-datos.ts", import.meta.url);
  const codigo = readFileSync(fuente, "utf8");
  const revision = codigo.indexOf("revisarDatabaseUrl");
  const consulta = codigo.indexOf("this.grupo.query(ESQUEMA)");
  assert.ok(revision > 0, "base-de-datos.ts no usa la revisión");
  assert.ok(revision < consulta, "se revisa después de consultar: el mensaje no se vería");
});
