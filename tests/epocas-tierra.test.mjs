/* La Tierra procedural se dibuja moviendo tierra real por placas. Tiene
   suficiente sutileza (rotación sobre esfera, máscara empaquetada, deriva por
   época) como para que un cambio inocente la rompa en silencio. */
import { test } from "node:test";
import assert from "node:assert/strict";

// El módulo de la máscara usa atob, que en Node no es global en todas las versiones.
globalThis.atob ??= s => Buffer.from(s, "base64").toString("binary");

const { EPOCHS, drawEpochLand } = await import("../sistema_solar/earth-epochs.js");
const mask = await import("../sistema_solar/earth-landmask.js");

/** Lienzo falso: registra en una rejilla qué píxeles se pintarían. */
function lienzo(width, height) {
  const px = new Uint8Array(width * height);
  return {
    px,
    ctx: {
      fillStyle: "",
      fillRect(x, y, w, h) {
        for (let j = Math.floor(y); j < Math.ceil(y + h); j++) {
          for (let i = Math.floor(x); i < Math.ceil(x + w); i++) {
            if (i >= 0 && i < width && j >= 0 && j < height) px[j * width + i] = 1;
          }
        }
      }
    }
  };
}

function pintar(stage, width = 1024, height = 512) {
  const l = lienzo(width, height);
  const celdas = drawEpochLand(l.ctx, width, height, stage, "#000");
  return { ...l, celdas, width, height };
}

test("la Tierra fundida no tiene tierra emergida", () => {
  assert.equal(pintar("molten").celdas, 0);
});

test("la tierra emergida crece hasta Pangea y luego se conserva", () => {
  const n = s => pintar(s).celdas;
  const arcaico = n("archaean"), proterozoico = n("proterozoic");
  const paleozoico = n("paleozoic"), pangea = n("pangaea");
  assert.ok(arcaico < proterozoico, `arcaico ${arcaico} debería ser menor que proterozoico ${proterozoico}`);
  assert.ok(proterozoico < paleozoico, `proterozoico ${proterozoico} < paleozoico ${paleozoico}`);
  assert.ok(paleozoico < pangea, `paleozoico ${paleozoico} < pangea ${pangea}`);

  // Entre Pangea y la ruptura la corteza no crece: la misma tierra se reparte.
  for (const s of ["breakup1", "breakup2"]) {
    assert.equal(n(s), pangea, `${s} debería mover la misma tierra que Pangea, no crearla`);
  }

  // Hoy sí tiene algo más: las islas oceánicas, que en las etapas anteriores
  // se omiten porque son volcanes jóvenes que entonces no existían.
  const hoy = n("modern");
  assert.ok(hoy > pangea, `hoy (${hoy}) debería sumar las islas que Pangea (${pangea}) no tenía`);
  assert.ok(hoy - pangea < pangea * 0.1, `las islas no deberían ser más del 10% de la tierra, y son ${((hoy - pangea) / pangea * 100).toFixed(1)}%`);
});

test("los continentes se dispersan de Pangea a hoy", () => {
  const dispersion = stage => {
    const { px, width, height } = pintar(stage);
    const xs = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) if (px[y * width + x]) xs.push(x);
    }
    const media = xs.reduce((a, b) => a + b, 0) / xs.length;
    return Math.sqrt(xs.reduce((a, b) => a + (b - media) ** 2, 0) / xs.length);
  };
  const pangea = dispersion("pangaea");
  const ruptura = dispersion("breakup2");
  const hoy = dispersion("modern");
  assert.ok(pangea < ruptura, `Pangea (${pangea.toFixed(0)}) debería estar más concentrada que la ruptura (${ruptura.toFixed(0)})`);
  assert.ok(ruptura < hoy, `la ruptura (${ruptura.toFixed(0)}) debería estar más concentrada que hoy (${hoy.toFixed(0)})`);
});

test("Pangea deja un océano abierto que hoy no existe", () => {
  // Panthalassa: una franja de longitud entera sin nada de tierra.
  const franjaVacia = stage => {
    const { px, width, height } = pintar(stage);
    let mayor = 0, actual = 0;
    for (let x = 0; x < width; x++) {
      let hayTierra = false;
      for (let y = 0; y < height && !hayTierra; y++) if (px[y * width + x]) hayTierra = true;
      actual = hayTierra ? 0 : actual + 1;
      if (actual > mayor) mayor = actual;
    }
    return mayor / width;
  };
  const pangea = franjaVacia("pangaea");
  assert.ok(pangea > 0.2, `Pangea debería dejar un océano de más del 20% de las longitudes, y deja ${(pangea * 100).toFixed(0)}%`);
  assert.ok(pangea > franjaVacia("modern"), "hoy no debería quedar un océano tan ancho como Panthalassa");
});

test("hoy reproduce la máscara real de la textura", () => {
  const { px, width, height } = pintar("modern");
  let dibujada = 0, ausente = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const esTierra = mask.isLand(
        Math.floor(x / width * mask.MASK_WIDTH),
        Math.floor(y / height * mask.MASK_HEIGHT)
      );
      if (!esTierra) continue;
      if (px[y * width + x]) dibujada++; else ausente++;
    }
  }
  const fidelidad = dibujada / (dibujada + ausente);
  assert.ok(fidelidad > 0.92, `la etapa moderna solo reproduce el ${(fidelidad * 100).toFixed(1)}% de la máscara`);
});

test("la máscara tiene tierra donde la tiene la Tierra", () => {
  // Puntos de control: continente frente a océano abierto.
  const enTierra = (lat, lon) => mask.isLand(
    Math.floor((lon + 180) / 360 * mask.MASK_WIDTH),
    Math.floor((90 - lat) / 180 * mask.MASK_HEIGHT)
  );
  assert.ok(enTierra(-9, -53), "el centro de la Amazonía debería ser tierra");
  assert.ok(enTierra(23, 13), "el Sáhara debería ser tierra");
  assert.ok(enTierra(-25, 134), "el centro de Australia debería ser tierra");
  assert.ok(!enTierra(0, -140), "el Pacífico central debería ser océano");
  assert.ok(!enTierra(-30, -15), "el Atlántico sur debería ser océano");
});

test("cada etapa de la línea temporal está declarada", () => {
  for (const s of ["molten","archaean","proterozoic","paleozoic","pangaea","breakup1","breakup2","modern"]) {
    assert.ok(EPOCHS[s], `falta la etapa ${s}`);
  }
});
