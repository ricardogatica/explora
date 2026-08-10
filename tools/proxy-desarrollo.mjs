/* El proxy de desarrollo: junta las dos aplicaciones en una sola dirección.

   En producción nginx reparte por prefijo —/universo/* al universo, el resto a
   materias— y las dos viven en el mismo dominio. En desarrollo cada una levanta
   su propio servidor en su propio puerto, y sin algo que las junte los enlaces
   de una a otra no funcionan: pulsar «Entrar al Universo» en el portal lleva a
   localhost:3000/universo/, que en la app de materias no existe.

   Esto hace de nginx: mismo reparto, mismos prefijos, un solo puerto. Lo que se
   ve en local es lo que va a haber publicado.

   Sin dependencias, y a propósito: es una herramienta de desarrollo y no merece
   arrastrar un paquete al proyecto.

   Uso: node tools/proxy-desarrollo.mjs <puerto> <puertoMaterias> <puertoUniverso> */
import { createServer, request } from "node:http";
import { connect } from "node:net";
import { readdirSync } from "node:fs";

const [puerto, puertoMaterias, puertoUniverso] = process.argv.slice(2).map(Number);

/* «localhost» y no «127.0.0.1»: el servidor del universo escucha solo en el
   bucle IPv6 —[::1]:5173— y conectar por IPv4 daba conexión rechazada, que
   desde el navegador se veía como un 502 del proxy y no como lo que era. Con
   el nombre, Node prueba las dos familias. */
const MAQUINA = "localhost";

/* En producción basta el prefijo: el universo se compila y todo lo suyo cuelga
   de /universo/. En desarrollo no. Vite sirve desde la raíz sus rutas internas
   —/@fs/, /@id/, el runtime de recarga— y también las fuentes sin compilar, con
   la ruta que tienen en el disco: /app/rutas/portada.jsx, /cielo/data.js.

   Las carpetas del universo se leen del proyecto en vez de escribirlas aquí.
   Escritas se quedan viejas en cuanto alguien añade una: pasó con /cielo/ y
   /render/ al sacarlas de la carpeta antigua, y el síntoma es de los malos
   —la página carga, el HUD se pinta y la escena 3D no aparece—. */
const RAIZ_UNIVERSO = new URL("../universo/", import.meta.url);
const IGNORADAS = new Set(["node_modules", "build", "public", ".react-router"]);

const carpetasDelUniverso = readdirSync(RAIZ_UNIVERSO, { withFileTypes: true })
  .filter(entrada => entrada.isDirectory() && !IGNORADAS.has(entrada.name))
  .map(entrada => `/${entrada.name}/`);

const DE_VITE = ["/@", "/node_modules/", "/__manifest", ...carpetasDelUniverso];

const esDelUniverso = url =>
  url === "/universo" || url.startsWith("/universo/") || DE_VITE.some(prefijo => url.startsWith(prefijo));

const destino = url => (esDelUniverso(url) ? puertoUniverso : puertoMaterias);

/* Una barra final de más en estas rutas se perdona, y no por gusto.

   Materias redirige con 308 lo que no acaba en barra —así está configurada—, y
   un 308 es permanente: el navegador se lo queda. Basta con que una de estas
   peticiones llegue a materias una vez, por ejemplo mientras el universo aún
   está arrancando, para que el navegador siga pidiéndolas con barra durante
   toda la sesión aunque el reparto ya sea correcto. Vive el rato de averiguar
   por qué la escena no monta si nadie lo perdona aquí. */
const sinBarraFinal = url =>
  DE_VITE.some(prefijo => url.startsWith(prefijo)) && url.endsWith("/") && url.length > 1
    ? url.slice(0, -1)
    : url;

const servidor = createServer((entrada, salida) => {
  const puertoDestino = destino(entrada.url);
  const reenvio = request(
    { host: MAQUINA, port: puertoDestino, path: sinBarraFinal(entrada.url), method: entrada.method, headers: entrada.headers },
    respuesta => {
      salida.writeHead(respuesta.statusCode, respuesta.headers);
      respuesta.pipe(salida);
    }
  );
  reenvio.on("error", error => {
    /* Lo normal aquí es que la aplicación de destino todavía esté arrancando.
       Un 502 con el motivo escrito ahorra el rato de mirar por qué la página
       sale en blanco. */
    salida.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    salida.end(`El proxy no pudo hablar con el puerto ${puertoDestino}: ${error.message}\n`);
  });
  entrada.pipe(reenvio);
});

/* Las dos aplicaciones recargan en caliente por websocket. Sin reenviar el
   upgrade, la página carga pero deja de refrescarse sola al guardar, que es
   justo lo que se espera de un servidor de desarrollo. */
servidor.on("upgrade", (entrada, socket, cabeza) => {
  /* El socket de Vite pide en «/» con un token en la query, así que por la ruta
     es indistinguible de una página de materias. Se reconoce por el protocolo
     que anuncia. El de Next no necesita esto: el suyo va por /_next/, que el
     reparto normal ya resuelve. */
  const esDeVite = (entrada.headers["sec-websocket-protocol"] ?? "").includes("vite-hmr");
  const puertoDestino = esDeVite ? puertoUniverso : destino(entrada.url);
  const arriba = connect(puertoDestino, MAQUINA, () => {
    const cabeceras = Object.entries(entrada.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n");
    arriba.write(`${entrada.method} ${entrada.url} HTTP/1.1\r\n${cabeceras}\r\n\r\n`);
    if (cabeza?.length) arriba.write(cabeza);
    arriba.pipe(socket);
    socket.pipe(arriba);
  });
  arriba.on("error", () => socket.destroy());
  socket.on("error", () => arriba.destroy());
});

servidor.listen(puerto, () => {
  console.log(`  Explora completo   http://localhost:${puerto}`);
  console.log(`  El universo        http://localhost:${puerto}/universo/`);
  console.log("");
  console.log("  Detén todo con Ctrl+C");
});
