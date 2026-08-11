---
titulo: Potencias: propiedades y notación algebraica
materia: matematicas
categoria: Números y operaciones
descripcion: Las propiedades con letras, exponente cero y negativo, el signo y la notación científica.
bandas: [13-14]
orden: 105
---

# Potencias: propiedades y notación algebraica

Con la idea de potencia ya construida —base, exponente, cuadrados y cubos—, aquí
aparecen las letras. Escribir *a* y *n* en lugar de números concretos es lo que
permite decir una regla **una vez** en lugar de comprobarla caso por caso.

## Las propiedades

| Propiedad | Con números | Cómo se llama |
|---|---|---|
| aᵐ · aⁿ = aᵐ⁺ⁿ | 2³ · 2⁴ = 2⁷ | producto de igual base |
| aᵐ ÷ aⁿ = aᵐ⁻ⁿ | 2⁵ ÷ 2² = 2³ | cociente de igual base |
| (aᵐ)ⁿ = aᵐ·ⁿ | (2³)² = 2⁶ | potencia de una potencia |
| (a · b)ⁿ = aⁿ · bⁿ | (2·5)³ = 2³ · 5³ | potencia de un producto |
| (a/b)ⁿ = aⁿ / bⁿ | (2/3)² = 4/9 | potencia de un cociente |

**Ninguna hay que memorizarla**, y conviene deducirlas en voz alta:

```
2³ · 2⁴ = (2·2·2) · (2·2·2·2) = 2·2·2·2·2·2·2 = 2⁷
```

Tres factores más cuatro factores son siete factores. Eso es todo lo que dice la
primera propiedad, y una vez visto así no se olvida.

Las dos primeras exigen **la misma base**, y ahí está el error más frecuente:
2³ · 3³ no es 2⁶ ni 6⁶. Es 6³, por la cuarta propiedad.

## Exponente cero y negativo

Los dos salen de seguir el patrón, no de una regla nueva:

::actividad{tipo=potencias base=3 exponente=0 titulo="Baja el exponente hasta cero y más allá"}

Bajando un escalón se divide por la base, siempre. Al llegar a cero se obtiene 1, y
siguiendo hacia abajo aparecen las fracciones:

```
a⁰ = 1        (para cualquier a distinto de 0)
a⁻ⁿ = 1/aⁿ
```

**0⁰ queda fuera.** Es la única excepción y no es una omisión: según por dónde se
llegue, el patrón da 1 o da 0, así que no se le asigna valor en este nivel.

## El signo, que es donde todos caen

```
(−3)² = (−3) · (−3) = 9
−3²   = −(3 · 3)    = −9
```

Sin paréntesis, el exponente afecta solo al 3 y el signo menos se aplica al final.
Regla práctica: base negativa con exponente **par** da positivo; con exponente
**impar**, negativo. Y tiene sentido, porque los signos se van cancelando de dos en
dos.

## Notación científica

Junta las potencias de base 10 con las propiedades de arriba:

| Número | En notación científica |
|---|---|
| 300 000 000 | 3 · 10⁸ |
| 0,000045 | 4,5 · 10⁻⁵ |
| 6 371 000 | 6,371 · 10⁶ |

La forma correcta lleva **una sola cifra distinta de cero antes de la coma**:
45 · 10⁶ está mal escrito; es 4,5 · 10⁷.

Multiplicar en esta notación es aplicar la primera propiedad:

```
(3 · 10⁸) · (2 · 10⁵) = 6 · 10¹³
```

Se usa constantemente en física: la rapidez de la luz es 3 · 10⁸ m/s.

## Errores frecuentes

- **(a + b)² ≠ a² + b².** El más repetido de todos. (3+4)² = 49, no 9 + 16 = 25. Lo
  correcto es (a+b)² = a² + 2ab + b², y se comprueba con cualquier par de números.
- **Sumar exponentes con bases distintas.** La propiedad exige la misma base.
- **Creer que un exponente negativo da resultado negativo.** 2⁻² = 1/4.
- **Escribir la notación científica con más de una cifra entera.**
- **Aplicar (a·b)ⁿ a una suma.** No existe ninguna propiedad para (a+b)ⁿ tan simple;
  ese es justo el primer error de la lista.
