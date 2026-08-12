---
titulo: Números reales
materia: matematicas
categoria: (Segundo medio) Unidad 1 · Números
descripcion: Qué hay en ℝ, dónde aparecen los irracionales, raíces, aproximación y operaciones.
bandas: [14-15, 16-17]
orden: 210
refuerzo: [numeros-racionales, potencias-propiedades]
---

# Números reales

*Unidad 1 · Lección 1 — Segundo medio*

Los **números reales** (ℝ) son todos los que se pueden colocar en la recta
numérica. No hay huecos: a cada punto de la recta le corresponde un real, y a cada
real un punto.

Dentro de ℝ está todo lo anterior, y una familia nueva:

```
ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ

ℕ  naturales        1, 2, 3…
ℤ  enteros          …−2, −1, 0, 1, 2…
ℚ  racionales       todo lo que es a/b con b ≠ 0
𝕀  irracionales     lo que NO se puede escribir como a/b
ℝ  reales           ℚ ∪ 𝕀
```

## Qué distingue a un irracional

No es tener muchos decimales: 1/3 = 0,333… tiene infinitos. Es que sus decimales
**no terminan y no se repiten**, así que no hay ninguna fracción de enteros que lo
escriba exactamente.

| Número | Vale | Clase |
|---|---|---|
| 0,75 | 3/4 | racional, decimal exacto |
| 0,272727… | 27/99 = 3/11 | racional, decimal periódico |
| √2 | 1,4142135… | irracional |
| π | 3,1415926… | irracional |
| e | 2,7182818… | irracional |
| √9 | 3 | **racional**: la raíz salió exacta |

La última fila importa: una raíz no es automáticamente irracional. √9 = 3, y 3 es
entero.

## Números reales en el entorno

Los irracionales no son una rareza de la clase de matemáticas; aparecen en cuanto
se mide algo real:

- **La diagonal de un cuadrado de lado 1** mide exactamente √2. Es la primera
  longitud que la humanidad descubrió que no se podía escribir como fracción, y a
  los pitagóricos les costó aceptarlo.
- **La circunferencia de cualquier rueda** dividida por su diámetro da π, siempre,
  mida lo que mida la rueda.
- **La diagonal de una hoja A4** (21 × 29,7 cm) mide √(21² + 29,7²) ≈ 36,4 cm.
- **El interés compuesto continuo** lleva a e.
- **La proporción áurea** φ = (1 + √5)/2 ≈ 1,618 aparece en el crecimiento de
  algunas plantas.

## Raíces

La raíz n-ésima de a es el número que elevado a n da a:

```
ⁿ√a = b     si y solo si     bⁿ = a
```

**Con índice par el radicando no puede ser negativo** en los reales: no hay ningún
real que al cuadrado dé −4, porque cualquier real al cuadrado es positivo o cero.
Con índice impar sí: ³√(−8) = −2.

### Las propiedades

Todas salen de las de las potencias, porque una raíz es una potencia de exponente
fraccionario:

```
ⁿ√a = a^(1/n)          ⁿ√(aᵐ) = a^(m/n)

ⁿ√a · ⁿ√b = ⁿ√(a·b)              √2 · √8 = √16 = 4
ⁿ√a ÷ ⁿ√b = ⁿ√(a÷b)              √18 ÷ √2 = √9 = 3
ᵐ√(ⁿ√a)   = ᵐⁿ√a                 √(³√64) = ⁶√64 = 2
```

**No hay ninguna propiedad para la suma.** √(a+b) no es √a + √b, y se comprueba con
un ejemplo en diez segundos: √(9+16) = √25 = 5, mientras que √9 + √16 = 3 + 4 = 7.

### Simplificar y racionalizar

Sacar factores de la raíz:

```
√72 = √(36 · 2) = √36 · √2 = 6√2
```

Quitar la raíz del denominador, multiplicando arriba y abajo por lo mismo:

```
  3      3    √5     3√5
 ───  = ─── · ─── = ─────
  √5     √5   √5      5
```

Con una suma en el denominador se usa el conjugado:

```
   2         2      (√3 − 1)     2(√3 − 1)
────────  = ──────·───────── = ───────────  = √3 − 1
 √3 + 1     √3+1    (√3 − 1)        2
```

Funciona porque (√3 + 1)(√3 − 1) = 3 − 1 = 2, y la raíz desaparece.

## Aproximación y representación

Un irracional no se puede escribir entero, así que se aproxima, y hay que decir
**cómo**:

| Forma | √2 con 3 decimales | Qué hace |
|---|---|---|
| truncamiento | 1,414 | corta y ya |
| redondeo | 1,414 | mira la cifra siguiente |
| por exceso | 1,415 | el menor valor mayor que el número |
| por defecto | 1,414 | el mayor valor menor que el número |

El **error absoluto** es la diferencia con el valor real, y el **error relativo** es
esa diferencia dividida por el valor: dice si el error es grande *para lo que se
está midiendo*. Un error de 1 cm es enorme en un tornillo y despreciable en una
carretera.

### En la recta

√2 se puede construir con regla y compás exactamente: es la diagonal del cuadrado
de lado 1. Se lleva esa diagonal sobre la recta con el compás y ahí está el punto,
sin aproximar nada. No todos los irracionales se pueden construir así —π no—, pero
todos tienen su punto.

## Operaciones con reales

Se opera como siempre, con dos cuidados:

**Solo se suman raíces semejantes**, igual que solo se suman términos semejantes en
álgebra:

```
3√5 + 2√5 = 5√5          pero      √2 + √3  se queda así
√8 + √2 = 2√2 + √2 = 3√2            (primero simplificar)
```

**El resultado de operar dos irracionales puede ser racional:**

```
√2 · √2 = 2              (2 + √3) + (2 − √3) = 4
```

## Errores frecuentes

- **√(a + b) = √a + √b.** El más repetido de todos. Con 9 y 16 se ve enseguida que
  no.
- **Creer que toda raíz es irracional.** √16, √0,25 y ³√27 son racionales.
- **Escribir √(−4) = −2.** (−2)² = 4, no −4. En los reales esa raíz no existe.
- **Sumar raíces distintas.** √2 + √3 no es √5: elevando al cuadrado se ve que no.
- **Redondear a mitad de cálculo.** Los errores se acumulan; se redondea al final,
  y se dice con cuántas cifras.
