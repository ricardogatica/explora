/* La aritmética de la actividad de números racionales, sin React.

   Lo interesante aquí es que el decimal se calcula con división larga y no con la
   división de JavaScript. No es purismo: 1/3 en punto flotante da
   0.3333333333333333, dieciséis treses y una mentira, porque el decimal de verdad
   no termina. Lo que enseña esta página es justamente que hay dos clases de decimal
   —el que termina y el que se repite para siempre— y con la división del lenguaje
   esa diferencia no se puede ni ver ni demostrar.

   La división larga sí la ve: cuando un resto se repite, a partir de ahí las cifras
   se repiten igual, y eso es exactamente el periodo. Cuando el resto llega a cero,
   el decimal termina. Es el mismo procedimiento que se hace a mano en clase, que es
   otra razón para usarlo. */

export const MINIMO = 0, MAXIMO = 12;

const mcd = (a, b) => (b === 0 ? a : mcd(b, a % b));

/* La fracción irreducible. Se conserva el signo en el numerador, que es como se
   escribe: −3/4 y no 3/−4. */
export function simplificar(numerador, denominador) {
  if (denominador === 0) return null;
  const divisor = mcd(Math.abs(numerador), Math.abs(denominador)) || 1;
  const signo = denominador < 0 ? -1 : 1;
  return {
    numerador: (signo * numerador) / divisor,
    denominador: Math.abs(denominador) / divisor
  };
}

export const esIrreducible = (numerador, denominador) => {
  const simple = simplificar(numerador, denominador);
  return simple !== null &&
    simple.numerador === numerador && simple.denominador === denominador;
};

/* El decimal, por división larga.

   Devuelve la parte entera, las cifras que no se repiten y las que sí. Con eso se
   puede escribir 1/3 como 0,3 con el 3 marcado, y 5/8 como 0,625 sin nada marcado,
   que es la diferencia que hay que ver. */
export function decimalDe(numerador, denominador) {
  if (denominador === 0) return null;

  const negativo = (numerador < 0) !== (denominador < 0) && numerador !== 0;
  let resto = Math.abs(numerador) % Math.abs(denominador);
  const divisor = Math.abs(denominador);
  const entera = Math.floor(Math.abs(numerador) / divisor);

  const cifras = [];
  const vistos = new Map();   // resto → en qué posición apareció

  while (resto !== 0 && !vistos.has(resto)) {
    vistos.set(resto, cifras.length);
    resto *= 10;
    cifras.push(Math.floor(resto / divisor));
    resto %= divisor;
  }

  const desde = resto === 0 ? cifras.length : vistos.get(resto);
  return {
    negativo,
    entera,
    fijas: cifras.slice(0, desde).join(""),
    periodo: cifras.slice(desde).join(""),   // vacío si el decimal termina
    exacto: resto === 0
  };
}

/* El decimal escrito, con el periodo entre paréntesis: 0,8(3) para 5/6.

   Los paréntesis y no la rayita de encima porque la rayita necesita marcado y esto
   tiene que poder salir también en un texto suelto. */
export function decimalEscrito(numerador, denominador) {
  const d = decimalDe(numerador, denominador);
  if (!d) return null;
  const signo = d.negativo ? "−" : "";
  if (d.exacto && d.fijas === "") return `${signo}${d.entera}`;
  return `${signo}${d.entera},${d.fijas}${d.periodo ? `(${d.periodo})` : ""}`;
}

/* Un número mixto: 7/4 son 1 entero y 3/4. Devuelve null cuando no hay entero que
   sacar, para no escribir «0 enteros y 3/4», que no aclara nada. */
export function comoMixto(numerador, denominador) {
  if (denominador === 0 || Math.abs(numerador) < Math.abs(denominador)) return null;
  const entera = Math.trunc(numerador / denominador);
  const resto = Math.abs(numerador % denominador);
  return { entera, numerador: resto, denominador: Math.abs(denominador) };
}
