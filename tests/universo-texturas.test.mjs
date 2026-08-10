import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { conRutasDeTextura, rutaDeTextura, BASE_TEXTURAS } from "../universo/app/datos/texturas.js";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

/* Los datos de los cuerpos guardan rutas relativas heredadas del sitio
   anterior, y las URLs de esta app tienen otra profundidad. Cuando falta el
   prefijo no salta ningún error: la textura da 404 y la escena se dibuja sin
   ella. El anillo de Saturno estuvo así hasta que apareció en la consola del
   navegador, no en las pruebas.

   Por eso se prueban dos cosas: que el ayudante hace su trabajo, y que ninguna
   escena vuelve a pasarle a Three.js una ruta de BODY_DATA sin él. */

test("conRutasDeTextura antepone la base a cada textura", () => {
  const cuerpo = conRutasDeTextura({
    name: "Saturno",
    textures: { day: "textures/saturn/day.jpg", ring: "textures/saturn/ring.png" }
  });
  assert.equal(cuerpo.textures.day, `${BASE_TEXTURAS}textures/saturn/day.jpg`);
  assert.equal(cuerpo.textures.ring, `${BASE_TEXTURAS}textures/saturn/ring.png`);
  assert.equal(cuerpo.name, "Saturno", "el resto del cuerpo pasa intacto");
});

test("los cuerpos sin texturas pasan tal cual", () => {
  const cuerpo = { name: "Mercurio", color: 0x9ca3af };
  assert.equal(conRutasDeTextura(cuerpo), cuerpo);
});

test("rutaDeTextura deja pasar la ausencia de ruta", () => {
  assert.equal(rutaDeTextura(undefined), undefined);
  assert.equal(rutaDeTextura("textures/saturn/ring.png"), `${BASE_TEXTURAS}textures/saturn/ring.png`);
});

/* Lectura del código fuente, no de la escena: montar Three.js aquí exigiría un
   navegador, y lo que se vigila —haber olvidado el prefijo— se ve en el texto.

   Se parte en sentencias y no en líneas porque estas escenas vienen del sitio
   anterior, donde una línea encadena veinte sentencias: buscando por línea, un
   olvido se esconde detrás de cualquier otra mención correcta de al lado. */
const ESCENAS = join(RAIZ, "universo/app/escenas");

test("ninguna escena usa una textura de BODY_DATA sin resolver su ruta", () => {
  const olvidos = [];
  for (const archivo of readdirSync(ESCENAS).filter(n => n.endsWith(".js"))) {
    const fuente = readFileSync(join(ESCENAS, archivo), "utf8");
    for (const sentencia of fuente.split(";")) {
      /* Solo cuenta leer la textura directamente de BODY_DATA, que es donde
         viven las rutas relativas. Una variable que ya pasó por el ayudante
         lleva la ruta buena y usarla es correcto. */
      if (!/BODY_DATA[^;]*\.textures\b/.test(sentencia)) continue;
      if (/conRutasDeTextura|rutaDeTextura/.test(sentencia)) continue;
      olvidos.push(`${archivo}: ${sentencia.trim().slice(0, 120)}`);
    }
  }
  assert.deepEqual(olvidos, [], "hay texturas sin prefijo: darán 404 sin avisar");
});
