/* Genera universo/cielo/universe/sky-catalog.js cruzando dos catálogos reales.

   Se ejecuta a mano, no en cada carga:

     node tools/construir-cielo.mjs <index.json de Stellarium> <hyg.csv.gz>

   Las fuentes se descargan de:
     https://raw.githubusercontent.com/Stellarium/stellarium/master/skycultures/modern_iau/index.json
     https://codeberg.org/astronexus/hyg/media/branch/main/data/hyg/CURRENT/hyg_v44.csv.gz

   No se versionan porque el CSV pesa 13,6 MB comprimido y de él solo se usan
   las 744 estrellas que forman las figuras de las 88 constelaciones. El módulo
   generado sí se versiona: es la salida, es pequeño, y así el sitio no depende
   de que estas descargas sigan disponibles.

   AMBAS FUENTES SON CC BY-SA 4.0. El archivo generado es una obra derivada y
   lleva esa licencia en su cabecera. Quien lo reutilice queda sujeto al
   ShareAlike.
*/
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";

const [rutaFiguras, rutaCatalogo] = process.argv.slice(2);
if (!rutaFiguras || !rutaCatalogo) {
  console.error("uso: node tools/construir-cielo.mjs <index.json> <hyg.csv.gz>");
  process.exit(1);
}

/* --- figuras de las constelaciones --- */
const figuras = JSON.parse(readFileSync(rutaFiguras, "utf8"));
const hipsNecesarios = new Set();
const constelaciones = [];
for (const c of figuras.constellations) {
  const abreviatura = (c.id || "").split(" ").pop();
  const latino = c.common_name?.native ?? c.common_name?.english ?? abreviatura;
  const lineas = (c.lines ?? []).map(l => l.map(Number));
  for (const l of lineas) for (const h of l) hipsNecesarios.add(h);
  constelaciones.push({ abreviatura, latino, lineas });
}

/* --- catálogo de estrellas: se lee en streaming, son 119.615 filas --- */
const columnas = [];
const estrellas = new Map();
await new Promise((resolve, reject) => {
  const lector = createInterface({ input: createReadStream(rutaCatalogo).pipe(createGunzip()) });
  let primera = true;
  lector.on("line", linea => {
    // El CSV lleva comillas solo en algunos campos; un split simple basta
    // porque ningún valor que usamos contiene comas.
    const campos = linea.split(",").map(v => v.replace(/^"|"$/g, ""));
    if (primera) { columnas.push(...campos); primera = false; return; }
    const idx = n => columnas.indexOf(n);
    const hip = Number(campos[idx("hip")]);
    if (!hip || !hipsNecesarios.has(hip)) return;
    estrellas.set(hip, {
      hip,
      proper: campos[idx("proper")]?.trim() ?? "",
      bayer: campos[idx("bayer")]?.trim() ?? "",
      con: campos[idx("con")]?.trim() ?? "",
      ra: Number(campos[idx("ra")]),          // horas
      dec: Number(campos[idx("dec")]),        // grados
      dist: Number(campos[idx("dist")]),      // parsecs
      mag: Number(campos[idx("mag")]),
      spect: campos[idx("spect")]?.trim() ?? "",
      ci: campos[idx("ci")] === "" ? null : Number(campos[idx("ci")])
    });
  });
  lector.on("close", resolve);
  lector.on("error", reject);
});

/* --- color a partir del índice B-V ---

   B-V es la diferencia de brillo entre dos filtros y equivale a temperatura:
   negativo es azul y caliente, positivo rojo y frío. El camino es el físico, en
   dos pasos, en lugar de interpolar tres canales a ojo:

   1. B-V a temperatura, con la fórmula de Ballesteros (2012).
   2. Temperatura a RGB, con la aproximación de cuerpo negro de Helland.

   La versión anterior mezclaba los canales con curvas inventadas y le daba al
   verde su máximo en las estrellas amarillas, así que a las azules les quitaba
   verde y las dejaba lavanda: Sirio salía #baaada y Rigel #b7a8df. En la vista
   del universo, donde cada estrella ocupa tres píxeles, no se notaba; en la
   escala de soles, con Sirio a media pantalla, era imposible no verlo. */
function temperaturaDesdeIndice(bv) {
  return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
}

function colorDesdeIndice(ci, spect) {
  if (ci == null || Number.isNaN(ci)) {
    // Sin índice, se deduce de la clase espectral, que es la letra inicial.
    const clase = (spect[0] || "G").toUpperCase();
    ci = { O: -0.32, B: -0.20, A: 0.02, F: 0.36, G: 0.66, K: 1.05, M: 1.60 }[clase] ?? 0.66;
  }
  const k = temperaturaDesdeIndice(Math.max(-0.4, Math.min(2.5, ci))) / 100;
  const r = k <= 66 ? 255 : 329.698727446 * Math.pow(k - 60, -0.1332047592);
  const g = k <= 66
    ? 99.4708025861 * Math.log(k) - 161.1195681661
    : 288.1221695283 * Math.pow(k - 60, -0.0755148492);
  const b = k >= 66 ? 255 : k <= 19 ? 0 : 138.5177312231 * Math.log(k - 10) - 305.0447927307;
  const canal = v => Math.max(0, Math.min(255, Math.round(v)));
  return (canal(r) << 16) | (canal(g) << 8) | canal(b);
}

/* --- nombres ---
   Los nombres propios del catálogo son latinos o de origen árabe y se usan
   igual en español, salvo un puñado con forma castellana asentada. */
const EN_ESPANOL = {
  Sirius: "Sirio", Procyon: "Proción", Castor: "Cástor", Pollux: "Pólux",
  Capella: "Capella", Regulus: "Régulo", Spica: "Espiga", Antares: "Antares",
  Canopus: "Canopo", Arcturus: "Arturo", Polaris: "Polaris", Deneb: "Deneb",
  Altair: "Altair", Aldebaran: "Aldebarán", Fomalhaut: "Fomalhaut",
  Rigel: "Rigel", Betelgeuse: "Betelgeuse", Bellatrix: "Bellatrix",
  Achernar: "Achernar", Hadar: "Hadar", Mimosa: "Mimosa", Vega: "Vega"
};
const griego = {
  Alp: "Alfa", Bet: "Beta", Gam: "Gamma", Del: "Delta", Eps: "Épsilon",
  Zet: "Zeta", Eta: "Eta", The: "Theta", Iot: "Iota", Kap: "Kappa",
  Lam: "Lambda", Mu: "Mu", Nu: "Nu", Xi: "Xi", Omi: "Ómicron", Pi: "Pi",
  Rho: "Rho", Sig: "Sigma", Tau: "Tau", Ups: "Ípsilon", Phi: "Phi",
  Chi: "Chi", Psi: "Psi", Ome: "Omega"
};

const latinoPorAbreviatura = new Map(constelaciones.map(c => [c.abreviatura, c.latino]));

/* La designación de Bayer sin la constelación: "Pi-1", "Alfa". El nombre
   completo lo compone quien la muestre, que es el único que conoce el nombre
   español de la constelación. Emitirlo aquí daba "Pi-1 Orion", mezclando un
   sitio en español con el nombre latino. */
function designacionDe(e) {
  if (!e.bayer) return "";
  /* El catálogo escribe la designación como "Pi-2", con guion. Recortar solo
     los dígitos dejaba "Pi-", que no está en el mapa, así que caía al valor
     completo y salía "Pi-2-2" con el número repetido. */
  const sufijo = e.bayer.match(/(\d+)$/)?.[1] ?? "";
  const letra = griego[e.bayer.replace(/-?\d+$/, "")] ?? e.bayer.replace(/-?\d+$/, "");
  return sufijo ? `${letra}-${sufijo}` : letra;
}

function nombreDe(e) {
  if (e.proper) return EN_ESPANOL[e.proper] ?? e.proper;
  const desig = designacionDe(e);
  if (desig) return `${desig} ${latinoPorAbreviatura.get(e.con) ?? e.con}`;
  return `HIP ${e.hip}`;
}

const slug = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const PC_A_ANIOSLUZ = 3.26156;

/* --- salida --- */
const usadas = [...hipsNecesarios].filter(h => estrellas.has(h)).sort((a, b) => a - b);
const indicePorHip = new Map(usadas.map((h, i) => [h, i]));
const usados = new Set();

const filas = usadas.map(h => {
  const e = estrellas.get(h);
  const nombre = nombreDe(e);
  let s = slug(nombre);
  while (usados.has(s)) s += `-${e.hip}`;
  usados.add(s);
  const ly = e.dist > 0 && e.dist < 100000 ? +(e.dist * PC_A_ANIOSLUZ).toFixed(1) : null;
  return [
    e.hip, s, nombre, +e.ra.toFixed(5), +e.dec.toFixed(5),
    ly, +e.mag.toFixed(2), e.spect, colorDesdeIndice(e.ci, e.spect),
    e.con, e.proper ? 1 : 0, designacionDe(e)
  ];
});

const perdidas = [...hipsNecesarios].filter(h => !estrellas.has(h));

const salida = `/* GENERADO por tools/construir-cielo.mjs. No editar a mano.

   Obra derivada de dos catálogos, ambos bajo Creative Commons
   Attribution-ShareAlike 4.0 International (CC BY-SA 4.0):

   - Figuras de las 88 constelaciones: Stellarium, conjunto modern_iau.
     https://github.com/Stellarium/stellarium/tree/master/skycultures/modern_iau
   - Datos estelares: HYG Database, de astronexus.
     https://codeberg.org/astronexus/hyg

   Al ser derivado, ESTE ARCHIVO ESTÁ TAMBIÉN BAJO CC BY-SA 4.0. Quien lo
   reutilice queda sujeto a la misma licencia y debe citar ambas fuentes.

   Contiene ${filas.length} estrellas: las que forman las figuras. ${filas.filter(f => f[10]).length}
   tienen nombre propio${perdidas.length ? `. ${perdidas.length} referencia(s) de figura sin datos en el catálogo: ${perdidas.join(", ")}` : ""}.

   Cada fila es [hip, slug, nombre, ra(horas), dec(grados), añosLuz, magnitud,
   tipoEspectral, color, abreviaturaConstelación, tieneNombrePropio,
   designaciónDeBayer]. */

const FILAS = ${JSON.stringify(filas)};

export const SKY_STARS = FILAS.map(([hip, slug, name, ra, dec, ly, mag, spect, color, con, named, bayer]) => ({
  hip, slug, name, ra, dec, ly, mag, spect, color, con, named: named === 1, bayer
}));

export const SKY_STAR_BY_HIP = new Map(SKY_STARS.map(s => [s.hip, s]));

/* Figuras: cada línea es una polilínea de números HIP. Se filtran los HIP sin
   datos para que ninguna línea apunte a una estrella que no existe. */
export const SKY_FIGURES = ${JSON.stringify(constelaciones.map(c => ({
  abbr: c.abreviatura,
  latin: c.latino,
  lines: c.lineas.map(l => l.filter(h => indicePorHip.has(h))).filter(l => l.length > 1)
})))};
`;

writeFileSync("universo/cielo/universe/sky-catalog.js", salida);

const segmentos = constelaciones.reduce((n, c) => n + c.lineas.reduce((m, l) => m + l.length - 1, 0), 0);
console.log(`figuras: ${constelaciones.length} constelaciones, ${segmentos} segmentos`);
console.log(`estrellas: ${filas.length} (${filas.filter(f => f[10]).length} con nombre propio)`);
if (perdidas.length) console.log(`sin datos en el catálogo: ${perdidas.join(", ")}`);
console.log(`escrito universo/cielo/universe/sky-catalog.js`);
