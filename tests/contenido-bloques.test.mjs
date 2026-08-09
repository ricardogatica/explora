import { test } from "node:test";
import assert from "node:assert/strict";
import { partirEnBloques, leerAtributos, figurasDe } from "../contenido/bloques.js";

test("un texto sin figuras es un solo bloque de markdown", () => {
  const bloques = partirEnBloques("# Hola\n\nUn párrafo.");
  assert.equal(bloques.length, 1);
  assert.equal(bloques[0].tipo, "markdown");
  assert.equal(bloques[0].texto, "# Hola\n\nUn párrafo.");
});

test("una figura parte el texto en antes, figura y después", () => {
  const bloques = partirEnBloques([
    "Antes de la esfera.",
    "::figura{tipo=esfera radio=2}",
    "Después de la esfera."
  ].join("\n"));

  assert.deepEqual(bloques.map(b => b.tipo), ["markdown", "figura", "markdown"]);
  assert.equal(bloques[0].texto, "Antes de la esfera.");
  assert.equal(bloques[1].figura, "esfera");
  assert.deepEqual(bloques[1].parametros, { radio: "2" });
  assert.equal(bloques[2].texto, "Después de la esfera.");
});

test("una figura al principio no deja un bloque vacío delante", () => {
  // Un markdown vacío al principio se convertiría en un párrafo en blanco.
  const bloques = partirEnBloques("::figura{tipo=cubo}\n\nTexto.");
  assert.deepEqual(bloques.map(b => b.tipo), ["figura", "markdown"]);
});

test("dos figuras seguidas no dejan un bloque vacío entre medias", () => {
  const bloques = partirEnBloques("::figura{tipo=cubo}\n::figura{tipo=esfera}");
  assert.deepEqual(bloques.map(b => b.tipo), ["figura", "figura"]);
});

test("el título se separa de los parámetros de la figura", () => {
  /* `titulo` es del pie de la figura y no de su geometría: si se colara entre
     los parámetros, crearFigura recibiría una propiedad que no entiende. */
  const [figura] = partirEnBloques('::figura{tipo=cono radio=1 alto=3 titulo="Un cono"}');
  assert.equal(figura.titulo, "Un cono");
  assert.deepEqual(figura.parametros, { radio: "1", alto: "3" });
});

test("los atributos aceptan comillas, y las necesitan cuando hay espacios", () => {
  assert.deepEqual(leerAtributos('tipo=esfera radio=2'), { tipo: "esfera", radio: "2" });
  assert.deepEqual(leerAtributos('titulo="Con espacios" tipo=cubo'),
    { titulo: "Con espacios", tipo: "cubo" });
  assert.deepEqual(leerAtributos("titulo='Comilla simple'"), { titulo: "Comilla simple" });
  assert.deepEqual(leerAtributos('radio = 2'), { radio: "2" }, "espacios alrededor del igual");
});

test("una línea que solo se parece a una figura no se parte", () => {
  /* Si en una página de lenguaje alguien escribe sobre la sintaxis, el texto no
     debe desaparecer convertido en una figura rota. */
  const bloques = partirEnBloques("Para incrustar se escribe `::figura{tipo=esfera}` en una línea.");
  assert.equal(bloques.length, 1);
  assert.equal(bloques[0].tipo, "markdown");
});

test("figurasDe encuentra las figuras de una página sin trocearla", () => {
  const figuras = figurasDe("Texto\n::figura{tipo=cubo lado=2}\nMás texto\n::figura{tipo=cilindro}");
  assert.deepEqual(figuras.map(f => f.figura), ["cubo", "cilindro"]);
});

test("una figura sin tipo se detecta, en vez de pasar en silencio", () => {
  const [figura] = partirEnBloques("::figura{radio=2}");
  assert.equal(figura.figura, undefined,
    "sin tipo, quien la pinte tiene que poder decir que falta");
});
