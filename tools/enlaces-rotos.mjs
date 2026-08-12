#!/usr/bin/env node
/* Recorre el sitio construido y avisa de los enlaces internos que no llevan a
   ninguna parte.

   Existe porque un enlace roto no rompe nada al construir: la página se genera, el
   enlace se pinta y solo falla cuando alguien lo pulsa. Pasó con /ruta/previo/, que
   se enlazaba desde la vista por edad de «antes de los 5» y devolvía un 404; leyendo
   el código no se veía, porque el enlace era correcto para las otras seis bandas.

   Sin servidor: se resuelve cada enlace contra los archivos de la carpeta, que es lo
   que nginx va a servir. */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITIO = join(RAIZ, "materias/out");

function paginas(carpeta = SITIO, encontradas = []) {
  for (const entrada of readdirSync(carpeta)) {
    const ruta = join(carpeta, entrada);
    if (statSync(ruta).isDirectory()) paginas(ruta, encontradas);
    else if (entrada === "index.html") encontradas.push(ruta);
  }
  return encontradas;
}

/* Un enlace existe si hay un index.html en su carpeta, o el archivo suelto. Los
   externos, los anclas y los del universo —que sirve la otra aplicación— no se
   comprueban aquí. */
const existe = enlace => {
  const limpio = enlace.split("#")[0].split("?")[0];
  const destino = join(SITIO, limpio);
  return existsSync(join(destino, "index.html")) || existsSync(destino);
};

const rotos = [];
let revisados = 0;

for (const archivo of paginas()) {
  const desde = archivo.replace(SITIO, "").replace(/\/index\.html$/, "") || "/";
  const html = readFileSync(archivo, "utf8");
  for (const enlace of new Set([...html.matchAll(/href="(\/[^"]*)"/g)].map(m => m[1]))) {
    if (enlace.startsWith("/universo") || enlace.startsWith("/_next")) continue;
    revisados++;
    if (!existe(enlace)) rotos.push(`${desde}  →  ${enlace}`);
  }
}

console.log(`${revisados} enlaces internos comprobados en ${paginas().length} páginas`);
if (rotos.length) {
  console.error(`\n${rotos.length} rotos:\n  ` + [...new Set(rotos)].join("\n  "));
  process.exit(1);
}
console.log("ninguno roto");
