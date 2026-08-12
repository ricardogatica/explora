---
titulo: Técnicas de conteo
materia: matematicas
categoria: (Segundo medio) Unidad 4 · Probabilidad y estadística
descripcion: Contar sin enumerar: principio multiplicativo, permutaciones, variaciones y combinaciones.
bandas: [15-17]
orden: 510
refuerzo: [regla-de-laplace, datos-probabilidad]
---

# Técnicas de conteo

*Unidad 4 · Lección 1 — Segundo medio*

La regla de Laplace pide dividir casos favorables entre casos posibles. El problema
casi nunca es dividir: es **contar** sin escribirlos todos, porque son demasiados.

## El principio multiplicativo

Si una elección se hace en pasos, el total es el **producto** de las opciones de
cada paso.

```
3 poleras × 4 pantalones × 2 pares de zapatos = 24 conjuntos
```

Con eso solo ya se resuelve mucho:

- Una patente de 4 letras y 2 dígitos: 26⁴ · 10² = 45 697 600.
- Un PIN de 4 dígitos: 10⁴ = 10 000.
- Un menú de 3 entradas, 5 fondos y 2 postres: 30 comidas distintas.

**Cuidado:** solo vale si las opciones de un paso no dependen de lo elegido antes.
Si al sacar una carta no se devuelve, el segundo paso tiene una opción menos.

## La pregunta que decide todo

Antes de elegir fórmula hay que responder **dos preguntas**, y de sus respuestas
salen los cuatro casos:

1. ¿**Importa el orden**?
2. ¿Se puede **repetir** un elemento?

| ¿Orden? | ¿Repetición? | Se llama | Fórmula |
|---|---|---|---|
| sí | sí | variaciones con repetición | nʳ |
| sí | no | variaciones (sin repetición) | n! / (n − r)! |
| sí | no, y se usan todos | permutaciones | n! |
| no | no | combinaciones | n! / (r!(n − r)!) |

Equivocarse de fórmula casi siempre es haber respondido mal la primera pregunta.

**La prueba del intercambio:** toma dos elementos de un resultado y cámbialos de
sitio. Si eso da un resultado **distinto**, el orden importa.

- Podio: oro–plata cambiado por plata–oro es otro podio → **importa**.
- Comisión de dos personas: Ana–Luis o Luis–Ana es la misma comisión → **no
  importa**.

## Factorial

```
n! = n · (n−1) · (n−2) · … · 2 · 1

5! = 120        10! = 3 628 800        0! = 1 (por convenio útil)
```

Crece de forma brutal: 20! ya pasa de dos trillones. Por eso casi nunca se calcula
entero; se simplifica antes.

```
 10!     10 · 9 · 8 · 7!
─────  = ───────────────  = 720
  7!            7!
```

## Permutaciones y variaciones

Las dos ordenan, y por eso van juntas: la diferencia es si se usan todos los
elementos o solo algunos.

### Permutaciones: ordenar todos

Ordenar **todos** los elementos:

```
Pₙ = n!
```

- Ordenar 5 libros en un estante: 5! = **120** formas.
- Ordenar las letras de ROMA: 4! = 24.

**Con elementos repetidos** hay que dividir por los factoriales de las repeticiones,
porque intercambiar dos letras iguales no da una palabra nueva:

```
                  n!
P = ──────────────────────────
      n₁! · n₂! · … · n_k!
```

Las letras de CASA: 4!/2! = **12**, no 24, porque las dos aes son indistinguibles.

### Variaciones: ordenar algunos

Ordenar **algunos** de los elementos, cuando el orden importa:

```
              n!
V(n, r) = ──────────
           (n − r)!
```

Podio de oro, plata y bronce entre 8 corredores:

```
V(8,3) = 8!/5! = 8 · 7 · 6 = 336
```

Se ve directo con el principio multiplicativo: 8 candidatos al oro, 7 a la plata, 6
al bronce.

**Con repetición** es simplemente nʳ: una clave de 4 dígitos es V'(10,4) = 10⁴.

## Combinaciones

Elegir **un grupo**, sin que importe el orden:

```
                n!                  ⎛n⎞
C(n, r) = ───────────────   que es  ⎜ ⎟, «número combinatorio»
            r! (n − r)!             ⎝r⎠
```

Comisión de 3 personas entre 8:

```
C(8,3) = 8! / (3! · 5!) = 336 / 6 = 56
```

Es exactamente el podio dividido por 3!, y ahí está la relación entre las dos:
**cada grupo de 3 se puede ordenar de 3! = 6 maneras**, y todas cuentan como una
sola cuando el orden da igual.

### Dos propiedades útiles

```
C(n, r) = C(n, n−r)        elegir 3 de 8 es lo mismo que descartar 5
C(n, 0) = C(n, n) = 1      hay una sola forma de no elegir a nadie
```

La primera ahorra cuentas: C(20,18) es más fácil como C(20,2) = 190.

### El Kino y el Loto

```
Loto: elegir 6 números de 41, sin orden
C(41,6) = 4 496 388

Probabilidad de acertar los 6 con un cartón: 1 entre 4 496 388
```

Ese número —y no una intuición— es lo que hace comprensible la lección siguiente.

## Cómo atacar un problema

1. ¿Cuántos elementos hay en total (n) y cuántos se eligen (r)?
2. ¿Importa el orden? Aplica la prueba del intercambio.
3. ¿Se puede repetir?
4. Elige la fórmula de la tabla y simplifica los factoriales **antes** de
   multiplicar.
5. Comprueba el orden de magnitud: elegir un grupo siempre da menos que ordenarlo.

## Errores frecuentes

- **Usar permutaciones donde van combinaciones.** Es el error dominante, y siempre
  da un resultado más grande de lo que debería.
- **Olvidar dividir por las repeticiones** en palabras con letras iguales.
- **Calcular factoriales enteros.** 20! no cabe cómodo en ninguna calculadora
  escolar; se simplifica primero.
- **Sumar cuando había que multiplicar.** Se suma cuando las opciones son
  alternativas («o»), se multiplica cuando son pasos («y»).
- **Suponer que las opciones no cambian** cuando no hay reposición.
