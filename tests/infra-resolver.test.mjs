import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/* El script que le dice a nginx dónde está su DNS.

   Se prueba de verdad —ejecutándolo— y no leyendo su texto, porque el fallo que
   motivó estas pruebas era de sintaxis de nginx y no de lógica: una dirección
   IPv6 sin corchetes hace que nginx lea el último grupo como un puerto y se
   niegue a arrancar con «invalid port in resolver». En local el DNS era IPv4, así
   que no se notó hasta desplegarlo. Aquí se le dan las dos familias. */

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(RAIZ, "infra/resolver.sh");

function correr(contenidoDeResolvConf) {
  const carpeta = mkdtempSync(join(tmpdir(), "resolver-"));
  const fuente = join(carpeta, "resolv.conf");
  const destino = join(carpeta, "salida", "resolver.conf");
  if (contenidoDeResolvConf !== null) writeFileSync(fuente, contenidoDeResolvConf);

  const salidaEstandar = execFileSync("sh", [SCRIPT], {
    env: { ...process.env, RESOLVER_FUENTE: fuente, RESOLVER_DESTINO: destino },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  return { escrito: readFileSync(destino, "utf8").trim(), dicho: salidaEstandar.trim() };
}

test("una dirección IPv6 se escribe entre corchetes", () => {
  /* El caso real de Railway. Sin corchetes, nginx dice «invalid port in
     resolver "fd12::10"» y el contenedor no arranca. */
  const { escrito } = correr("nameserver fd12::10\n");
  assert.equal(escrito, "resolver [fd12::10] valid=10s ipv6=on;");
});

test("una IPv4 se escribe tal cual", () => {
  // 127.0.0.11 es el DNS de Docker, que es donde esto se prueba en casa.
  const { escrito } = correr("nameserver 127.0.0.11\n");
  assert.equal(escrito, "resolver 127.0.0.11 valid=10s ipv6=on;");
});

test("con las dos familias, cada una con su forma", () => {
  const { escrito } = correr("nameserver 10.0.0.2\nnameserver fd00::1\n");
  assert.equal(escrito, "resolver 10.0.0.2 [fd00::1] valid=10s ipv6=on;");
});

test("lo que no es un nameserver se ignora", () => {
  const { escrito } = correr(
    "# un comentario\nsearch railway.internal\noptions ndots:0\nnameserver fd12::10\n"
  );
  assert.equal(escrito, "resolver [fd12::10] valid=10s ipv6=on;");
});

test("sin ningún nameserver, no aborta y deja el include vacío", () => {
  /* El bloque /api no resolvería, pero el resto del sitio —que es todo lo
     demás— se sirve igual. Abortar aquí dejaría la web entera caída por no
     poder guardar estadísticas. */
  const { escrito } = correr("search railway.internal\n");
  assert.equal(escrito, "");
});

test("si no hay resolv.conf que leer, tampoco aborta", () => {
  const { escrito } = correr(null);
  assert.equal(escrito, "");
});

test("dice en el registro qué encontró", () => {
  // Es la única pista de por qué /api resuelve o no en un despliegue.
  const { dicho } = correr("nameserver fd12::10\n");
  assert.match(dicho, /\[fd12::10\]/);
});
