import { test } from "node:test";
import assert from "node:assert/strict";

/* Las fórmulas se prueban sin Three.js: se comparan las medidas que muestra cada
   figura con las de un libro. Es la mitad que puede estar mal sin que se vea —una
   esfera girando parece correcta aunque su volumen esté calculado como el de un
   cilindro— y es justo la mitad que un niño va a leer y creer. */

/* Se importan las fórmulas evaluando el módulo con un Three.js de mentira: aquí
   solo interesa lo que devuelve `medidas`, no la geometría. */
const { crearFigura, NOMBRES_DE_FIGURA } = await import("../compartido/primitivas.js")
  .catch(async error => {
    if (!error.message.includes("three")) throw error;
    throw new Error("Este test necesita que 'three' se resuelva; se ejecuta desde la raíz con node --test");
  });

const medida = (figura, etiqueta) =>
  figura.medidas.find(([nombre]) => nombre === etiqueta)?.[1];

const numero = texto => Number(String(texto).replace(/[^\d.,-]/g, "").replace(",", "."));

test("la esfera calcula su superficie y su volumen, no los trae escritos", () => {
  const r = 3;
  const esfera = crearFigura("esfera", { radio: r });
  assert.equal(numero(medida(esfera, "Diámetro")), 6);
  assert.ok(Math.abs(numero(medida(esfera, "Superficie")) - 4 * Math.PI * r ** 2) < 0.02);
  assert.ok(Math.abs(numero(medida(esfera, "Volumen")) - (4 / 3) * Math.PI * r ** 3) < 0.02);
});

test("el cubo: seis caras y el volumen al cubo", () => {
  const cubo = crearFigura("cubo", { lado: 2 });
  assert.equal(medida(cubo, "Caras"), "6");
  assert.equal(numero(medida(cubo, "Superficie")), 24);
  assert.equal(numero(medida(cubo, "Volumen")), 8);
});

test("el prisma no confunde el área con el volumen", () => {
  // 2×3×4: superficie 2(6+8+12)=52, volumen 24. Son números distintos a
  // propósito: con un cubo de lado 6 ambos darían 216 y el test no probaría nada.
  const prisma = crearFigura("prisma", { ancho: 2, alto: 3, fondo: 4 });
  assert.equal(numero(medida(prisma, "Superficie")), 52);
  assert.equal(numero(medida(prisma, "Volumen")), 24);
});

test("el cilindro incluye las dos tapas en su superficie", () => {
  /* El error clásico es dar solo el área lateral. Con r=1 y h=2: lateral 4π,
     tapas 2π, total 6π ≈ 18,85. */
  const cilindro = crearFigura("cilindro", { radio: 1, alto: 2 });
  assert.ok(Math.abs(numero(medida(cilindro, "Superficie")) - 6 * Math.PI) < 0.02);
  assert.ok(Math.abs(numero(medida(cilindro, "Volumen")) - 2 * Math.PI) < 0.02);
});

test("el cono vale un tercio del cilindro que lo contiene", () => {
  const cono = crearFigura("cono", { radio: 3, alto: 4 });
  assert.ok(Math.abs(numero(medida(cono, "Volumen")) - (Math.PI * 9 * 4) / 3) < 0.02);
  // Generatriz de un 3-4-5.
  assert.equal(numero(medida(cono, "Generatriz")), 5);
});

test("la pirámide también vale un tercio de su prisma", () => {
  const piramide = crearFigura("piramide", { lado: 3, alto: 4 });
  assert.equal(numero(medida(piramide, "Área de la base")), 9);
  assert.equal(numero(medida(piramide, "Volumen")), 12);
});

test("cada figura trae medidas y todas llevan unidad", () => {
  for (const nombre of NOMBRES_DE_FIGURA) {
    const figura = crearFigura(nombre);
    assert.ok(figura, `${nombre} no se construye con sus valores por defecto`);
    assert.ok(figura.medidas.length >= 3, `${nombre} muestra menos de tres medidas`);
    for (const [etiqueta, valor] of figura.medidas) {
      assert.ok(etiqueta && valor, `${nombre} tiene una medida a medias`);
      // «u», «u²», «u³» o un número suelto como el conteo de caras.
      assert.match(String(valor), /u[²³]?$|^\d+$/,
        `${nombre}: «${etiqueta}» vale «${valor}» y no dice de qué unidad habla`);
    }
  }
});

test("una figura que no existe devuelve null en vez de reventar", () => {
  // El nombre viene escrito a mano dentro de un markdown: equivocarse es
  // cuestión de tiempo, y la página tiene que poder decirlo.
  assert.equal(crearFigura("dodecaedro"), null);
  assert.equal(crearFigura(""), null);
});

test("los parámetros llegan como texto desde el markdown y se aceptan igual", () => {
  const conTexto = crearFigura("cubo", { lado: "2" });
  assert.equal(numero(medida(conTexto, "Volumen")), 8);
});
