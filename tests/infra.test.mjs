import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const leer = ruta => readFileSync(join(RAIZ, ruta), "utf8");

const WEB = leer("infra/Dockerfile.web");
const API = leer("infra/Dockerfile.api");
const PLANTILLA = leer("infra/nginx.conf.template");

/* Hay un Dockerfile por servicio porque Railway no documenta cómo elegir un
   destino dentro de un multi-etapa. El precio es que la fase de compilación
   está escrita dos veces, y dos copias se separan solas: alguien añade un
   workspace en una y la otra imagen se construye con otro código. Nadie lo
   notaría hasta ver un despliegue con la mitad vieja. */
function faseDeCompilacion(dockerfile) {
  const desde = dockerfile.indexOf("FROM node:22-alpine AS construccion");
  const hasta = dockerfile.indexOf("# ── La imagen");
  return dockerfile.slice(desde, hasta).trim();
}

test("las dos imágenes se compilan exactamente igual", () => {
  assert.ok(faseDeCompilacion(WEB).length > 200, "no encuentro la fase de compilación");
  assert.equal(faseDeCompilacion(WEB), faseDeCompilacion(API),
    "la fase de compilación difiere entre los dos Dockerfile: una imagen se " +
    "construiría con otro código");
});

test("las pruebas corren dentro de las dos imágenes", () => {
  /* Una imagen que no pasa sus pruebas no debería llegar a existir, y eso
     incluye el validador de contenido: un .md mal etiquetado desaparecería de la
     ruta sin avisar. */
  for (const [nombre, dockerfile] of [["web", WEB], ["api", API]]) {
    assert.match(dockerfile, /RUN node --test/, `${nombre} no corre las pruebas al construirse`);
  }
});

/* ── La plantilla de nginx ────────────────────────────────────────────────── */

test("el filtro de envsubst deja en paz a las variables de nginx", () => {
  /* Sin filtro, envsubst sustituye TODO lo que parezca $VARIABLE, y la
     configuración está llena de variables de nginx que se escriben igual:
     $uri, $host, $arg_slug… Se quedarían vacías y el sitio serviría cualquier
     cosa. Es un fallo que no da error: arranca y responde mal. */
  assert.match(WEB, /NGINX_ENVSUBST_FILTER="\^\(PORT\|API_ORIGIN\)\$"/,
    "falta el filtro de envsubst, o no cubre exactamente las dos variables");
});

test("solo se sustituyen las dos variables previstas", () => {
  const sustituibles = new Set([...PLANTILLA.matchAll(/\$\{(\w+)\}/g)].map(m => m[1]));
  assert.deepEqual([...sustituibles].sort(), ["API_ORIGIN", "PORT"],
    "hay variables con llaves que el filtro no va a sustituir, o sobra alguna");
});

test("nginx escucha en el puerto que le impongan, y en las dos familias", () => {
  /* Las plataformas eligen el puerto y lo pasan en PORT; un 80 fijo deja el
     servicio inalcanzable. Y en IPv6 además de IPv4, porque las redes privadas
     de algunas plataformas resuelven a IPv6. */
  assert.match(PLANTILLA, /listen \$\{PORT\};/);
  assert.match(PLANTILLA, /listen \[::\]:\$\{PORT\};/);
});

test("la API se alcanza por una variable, no por un nombre fijo", () => {
  // El nombre del servicio cambia según dónde se despliegue.
  assert.match(PLANTILLA, /set \$api "\$\{API_ORIGIN\}";/);
  assert.doesNotMatch(PLANTILLA, /proxy_pass\s+http:\/\/api:/,
    "la dirección de la API está escrita a mano: no sobrevive a un cambio de plataforma");
});

test("el resolver se averigua al arrancar y no está escrito", () => {
  /* 127.0.0.11 es el DNS de Docker y en otra plataforma no existe. El script lo
     lee del propio contenedor. */
  assert.doesNotMatch(PLANTILLA, /resolver\s+127\.0\.0\.11/);
  assert.match(PLANTILLA, /include \/etc\/nginx\/extra\/resolver\.conf;/);
  /* Fuera de conf.d: nginx incluye solo todo lo que hay ahí, así que un include
     explícito lo cargaría dos veces y «resolver» duplicado no deja arrancar. */
  assert.doesNotMatch(PLANTILLA, /include \/etc\/nginx\/conf\.d\//);
  assert.match(leer("infra/resolver.sh"), /\/etc\/resolv\.conf/);
});

test("la API escucha en la doble pila", () => {
  /* En «0.0.0.0» queda invisible para quien la llame por IPv6, que es como
     resuelven los nombres internos de algunas plataformas. */
  assert.match(leer("api/src/main.ts"), /app\.listen\(puerto, "::"\)/);
  assert.match(leer("api/src/main.ts"), /process\.env\.PORT/);
});
