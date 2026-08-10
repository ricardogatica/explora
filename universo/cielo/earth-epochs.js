/* Dibuja la tierra emergida de la Tierra en cada etapa de la línea temporal.

   La técnica es la de los mapas paleogeográficos de verdad: las costas del
   pasado son las costas de hoy, movidas. Se parte de la máscara real extraída
   de la textura diurna, se reparte en placas, y cada placa se desplaza según
   la época. Así Pangea tiene la forma de África y Sudamérica encajando, no un
   polígono inventado.

   ADVERTENCIA PARA QUIEN REVISE EL CONTENIDO
   Las posiciones de las placas de la tabla EPOCHS son aproximaciones de
   conocimiento general, no proceden de un dataset paleogeográfico citado.
   Sirven para transmitir la idea —los continentes se mueven, estuvieron
   juntos, se separaron— con costas reconocibles. Si este material se publica
   como recurso educativo, conviene que alguien con formación en geología
   valide o corrija los números. Están en un solo sitio y son fáciles de tocar.
*/

import { MASK_HEIGHT, MASK_WIDTH, isLand } from "./earth-landmask.js";

/* Cada celda de tierra pertenece a una placa. Se decide por caja de
   latitud/longitud, en ese orden: la primera que encaja gana, así que las
   cajas más específicas van antes que las generales. */
const PLATES = [
  { id:"ant", lat:[-90,-60], lon:[-180,180] },
  { id:"aus", lat:[-50,-8],  lon:[105,160]  },
  { id:"ind", lat:[2,32],    lon:[66,92]    },
  { id:"grn", lat:[58,85],   lon:[-75,-10]  },
  { id:"sam", lat:[-58,14],  lon:[-84,-32]  },
  { id:"nam", lat:[8,85],    lon:[-172,-52] },
  { id:"afr", lat:[-36,38],  lon:[-19,54]   },
  { id:"eur", lat:[0,85],    lon:[-14,190]  }
];

/* Devuelve null cuando la celda no pertenece a ninguna placa continental.
   Son sobre todo islas oceánicas, y eso importa: la mayoría son volcanes
   jóvenes que no existían en el pasado profundo. Hawái tiene unos 5 millones
   de años; en Pangea no había nada ahí. Arrastrarlas con una placa cualquiera
   las esparciría por un océano que debe estar vacío. */
function plateAt(lat, lon) {
  for (const p of PLATES) {
    if (lat >= p.lat[0] && lat <= p.lat[1] && lon >= p.lon[0] && lon <= p.lon[1]) return p.id;
  }
  return null;
}

/* Dónde estaba el centro de cada placa cuando Pangea estaba montada.

   Se mueven por ROTACIÓN sobre la esfera, no trasladando latitud y longitud.
   La diferencia importa: un casquete polar como la Antártida, trasladado en
   latitud, sigue ocupando todas las longitudes y jamás se ensambla con nada.
   Rotado, viaja como un cuerpo rígido y encaja donde debe. Es además como se
   construyen las reconstrucciones de verdad.

   África hace de ancla y apenas se mueve, que es la convención habitual. */
const PANGAEA_CENTER = {
  afr: { lat:  -8, lon:  12 },
  sam: { lat: -24, lon: -22 },
  nam: { lat:  16, lon: -14 },
  grn: { lat:  36, lon:  -4 },
  eur: { lat:  32, lon:  34 },
  ind: { lat: -34, lon:  42 },
  ant: { lat: -56, lon:  26 },
  aus: { lat: -44, lon:  58 }
};

const RAD = Math.PI / 180;

function toVector(lat, lon) {
  const la = lat * RAD, lo = lon * RAD, c = Math.cos(la);
  return [c * Math.cos(lo), Math.sin(la), c * Math.sin(lo)];
}

function toLatLon(v) {
  return {
    lat: Math.asin(Math.max(-1, Math.min(1, v[1]))) / RAD,
    lon: Math.atan2(v[2], v[0]) / RAD
  };
}

/* Rotación de Rodrigues: gira `v` un ángulo alrededor del eje unitario `k`. */
function rotate(v, k, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const kv = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  return [
    v[0] * c + (k[1] * v[2] - k[2] * v[1]) * s + k[0] * kv * (1 - c),
    v[1] * c + (k[2] * v[0] - k[0] * v[2]) * s + k[1] * kv * (1 - c),
    v[2] * c + (k[0] * v[1] - k[1] * v[0]) * s + k[2] * kv * (1 - c)
  ];
}

/* Para cada placa: el eje y el ángulo que llevan su centro actual hasta su
   centro en Pangea. Se calcula una vez, no por celda. */
const PLATE_ROTATION = (() => {
  const centrosActuales = {
    afr: { lat:   2, lon:  20 }, sam: { lat: -16, lon: -60 },
    nam: { lat:  46, lon: -100 }, grn: { lat:  72, lon: -42 },
    eur: { lat:  50, lon:  80 }, ind: { lat:  21, lon:  78 },
    ant: { lat: -85, lon:   0 }, aus: { lat: -25, lon: 133 }
  };
  const salida = {};
  for (const id of Object.keys(PANGAEA_CENTER)) {
    const desde = toVector(centrosActuales[id].lat, centrosActuales[id].lon);
    const hasta = toVector(PANGAEA_CENTER[id].lat, PANGAEA_CENTER[id].lon);
    let eje = [
      desde[1] * hasta[2] - desde[2] * hasta[1],
      desde[2] * hasta[0] - desde[0] * hasta[2],
      desde[0] * hasta[1] - desde[1] * hasta[0]
    ];
    const norma = Math.hypot(...eje);
    const coseno = Math.max(-1, Math.min(1, desde[0] * hasta[0] + desde[1] * hasta[1] + desde[2] * hasta[2]));
    // Si ya coinciden, cualquier eje sirve porque el ángulo es cero.
    eje = norma < 1e-9 ? [0, 1, 0] : eje.map(n => n / norma);
    salida[id] = { eje, angulo: Math.acos(coseno) };
  }
  return salida;
})();

/* drift: 0 es Pangea montada, 1 es la configuración actual.
   land: fracción de tierra que se dibuja, para las épocas en que había menos
   corteza continental emergida y muy dispersa.
   Las etapas anteriores a Pangea no son reconstrucciones: son una forma
   honesta de decir "había menos tierra y estaba repartida". */
export const EPOCHS = {
  molten:       { drift: 0.00, land: 0.00 },
  archaean:     { drift: 0.10, land: 0.18 },
  proterozoic:  { drift: 0.05, land: 0.45 },
  paleozoic:    { drift: 0.02, land: 0.80 },
  pangaea:      { drift: 0.00, land: 1.00 },
  breakup1:     { drift: 0.28, land: 1.00 },
  breakup2:     { drift: 0.58, land: 1.00 },
  modern:       { drift: 1.00, land: 1.00 }
};

/* Ruido reproducible: la misma etapa debe dibujarse igual en cada carga, así
   que nada de Math.random(). */
function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/* Pinta la tierra de una etapa sobre un contexto 2D equirectangular.
   Devuelve la cantidad de celdas dibujadas, que sirve para comprobar en los
   tests que cada etapa produce algo distinto. */
export function drawEpochLand(ctx, width, height, stage, fill) {
  const epoch = EPOCHS[stage] || EPOCHS.modern;
  if (epoch.land <= 0) return 0;

  const cellW = width / MASK_WIDTH;
  const cellH = height / MASK_HEIGHT;
  ctx.fillStyle = fill;

  let painted = 0;
  for (let my = 0; my < MASK_HEIGHT; my++) {
    const lat = 90 - (my + 0.5) / MASK_HEIGHT * 180;
    for (let mx = 0; mx < MASK_WIDTH; mx++) {
      if (!isLand(mx, my)) continue;

      const lon = (mx + 0.5) / MASK_WIDTH * 360 - 180;

      // En las épocas tempranas se conserva solo parte de la tierra, elegida
      // de forma estable para que no parpadee entre cargas.
      if (epoch.land < 1 && hash(mx, my) > epoch.land) continue;

      const placa = plateAt(lat, lon);
      const t = 1 - epoch.drift;                       // 1 = totalmente montada

      // Sin placa asignada es una isla oceánica. Hoy se dibuja donde está; en
      // el pasado se omite, porque casi ninguna existía todavía.
      if (!placa) {
        if (t > 0.01) continue;
        ctx.fillRect((lon + 180) / 360 * width, (90 - lat) / 180 * height, cellW + 1, cellH + 1);
        painted++;
        continue;
      }

      const giro = PLATE_ROTATION[placa];
      const destino = toLatLon(rotate(toVector(lat, lon), giro.eje, giro.angulo * t));

      const px = (((destino.lon + 180) / 360 * width) % width + width) % width;
      const py = (90 - destino.lat) / 180 * height;

      // +1 de solape para que no queden costuras entre celdas contiguas.
      ctx.fillRect(px, py, cellW + 1, cellH + 1);
      if (px + cellW + 1 > width) ctx.fillRect(px - width, py, cellW + 1, cellH + 1);
      painted++;
    }
  }
  return painted;
}
