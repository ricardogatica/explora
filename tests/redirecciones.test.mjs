import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { redirecciones, sinDestino } from "../tools/construir-redirecciones.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

/* Los enlaces que ya apuntan al sitio son lo único que no se puede reconstruir:
   ni los marcadores de nadie ni lo que tenga indexado un buscador se recuperan
   publicando otra vez. Por eso hay pruebas y no solo un script. */

test("toda página del sitio anterior tiene a dónde ir", () => {
  assert.deepEqual(sinDestino(), [], "hay páginas viejas sin destino nuevo");
});

/* Se comprueba contra la lista de rutas que el build va a generar, no contra el
   directorio del build: así la prueba vale también en un clon recién hecho y
   dentro de la imagen, donde las pruebas corren antes de compilar. */
test("las redirecciones apuntan a páginas que el build genera", async () => {
  const { rutasParaPrerenderizar } = await import("../universo/app/datos/rutas.js");
  const previstas = new Set(rutasParaPrerenderizar().map(ruta => `/universo${ruta}`));
  previstas.add("/universo/");                     // la portada, que es "/"

  const faltan = Object.entries(redirecciones())
    .filter(([, destino]) => !previstas.has(destino) && !previstas.has(destino.replace(/\/$/, "")))
    .map(([de, a]) => `${de} → ${a}`);

  assert.deepEqual(faltan, [], "redirigen a páginas que no existen");
});

test("el archivo de nginx está al día con el generador", () => {
  const enDisco = readFileSync(join(RAIZ, "infra/redirecciones.conf"), "utf8");
  for (const [de, a] of Object.entries(redirecciones())) {
    assert.ok(
      new RegExp(`^\\s*${de.replace(/[.]/g, "\\.")}\\s+${a};`, "m").test(enDisco),
      `falta en infra/redirecciones.conf: ${de} → ${a}. Regenéralo con
       node tools/construir-redirecciones.mjs > infra/redirecciones.conf`
    );
  }
});

/* star.html es el caso que dio origen a todo esto: 400 estrellas compartiendo un
   archivo y distinguidas por ?slug=. No cabe en el mapa —nginx enruta por $uri,
   sin la query— y se resuelve con una regla propia que hay que conservar. */
test("nginx traduce el star.html con slug en la query", () => {
  const conf = readFileSync(join(RAIZ, "infra/nginx.conf"), "utf8");
  assert.match(conf, /location = \/sistema_solar\/star\.html/);
  assert.match(conf, /\$arg_slug.*\/universo\/estrellas\/\$arg_slug/s);
});
