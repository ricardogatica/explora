/* La aritmética de la actividad de potencias, sin React.

   Está separada del componente para poder probarla con `node --test`: el .jsx no
   se puede importar desde una prueba sin montar un compilador, y lo que de verdad
   puede estar mal aquí no es el JSX sino la cuenta y cómo se escribe. Dos casos lo
   demostraron: con base 1 el exponente negativo daba «1/1», y la comparación
   afirmaba que el exponente siempre pesa más que la base, que es falso —10⁸ es cien
   millones y 8¹⁰ es mil setenta y tres millones—.

   Los números son pequeños a propósito: base hasta 10 y exponente hasta 8 dan como
   máximo 100 000 000, que cabe de sobra en un número de JavaScript. Nada de esto
   necesita precisión exacta ni una biblioteca. */

export const BASE_MINIMA = 1, BASE_MAXIMA = 10;
export const EXPONENTE_MINIMO = -3, EXPONENTE_MAXIMO = 8;

const SUPERINDICES = {
  "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴",
  5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹"
};

export const enSuperindice = numero =>
  String(numero).split("").map(caracter => SUPERINDICES[caracter] ?? caracter).join("");

/* Se agrupan los miles porque 100000000 no se lee y 100.000.000 sí. En es-CL el
   separador es el punto. */
const agrupar = numero => numero.toLocaleString("es-CL");

/* El valor de la potencia y su forma escrita.

   Con exponente negativo se devuelve la fracción y no el decimal: 2⁻³ = 1/8 dice
   lo que pasa y 0,125 lo esconde. */
export function calcular(base, exponente) {
  if (exponente >= 0) {
    const valor = base ** exponente;
    return { valor, escrito: agrupar(valor) };
  }
  const denominador = base ** -exponente;
  // Con base 1 el denominador es 1, y «1/1» se lee peor que «1».
  return {
    valor: 1 / denominador,
    escrito: denominador === 1 ? "1" : `1/${agrupar(denominador)}`
  };
}

/* La multiplicación desplegada, que es el sentido de la potencia. Con exponente
   cero se dice «ningún factor» en vez de dejarlo en blanco: el 1 que aparece sin
   explicación es justo lo que hace que a⁰ = 1 parezca arbitrario. */
export function expansion(base, exponente) {
  if (exponente === 0) return "1 (ningún factor)";
  if (exponente < 0) return `1 ÷ (${Array(-exponente).fill(base).join(" · ")})`;
  return Array(exponente).fill(base).join(" · ");
}

/* La potencia con los dos números intercambiados, o null si no hay nada que
   comparar: con 3³ el intercambio es la misma potencia, y con exponente negativo
   o cero no significa nada. */
export function intercambiada(base, exponente) {
  if (base === exponente || exponente <= 0 || exponente > BASE_MAXIMA) return null;
  return { escrita: `${exponente}${enSuperindice(base)}`, ...calcular(exponente, base) };
}

export const comoSeEscribe = (base, exponente) => `${base}${enSuperindice(exponente)}`;

/* Los tres escalones alrededor del exponente actual: el anterior, este y el
   siguiente. Es lo que hace visible que cada paso multiplica o divide por la base,
   y con ello que el exponente cero no sea una regla aparte. */
export function escalones(base, exponente) {
  return [exponente - 1, exponente, exponente + 1]
    .filter(n => n >= EXPONENTE_MINIMO && n <= EXPONENTE_MAXIMO)
    .map(n => ({ n, ...calcular(base, n) }));
}
