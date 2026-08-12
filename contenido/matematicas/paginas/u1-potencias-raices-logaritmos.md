---
titulo: Potencias, raíces y logaritmos
materia: matematicas
categoria: Unidad 1 · Números
descripcion: Exponente racional, propiedades, y el logaritmo como la pregunta inversa de la potencia.
bandas: [15-17]
orden: 220
refuerzo: [potencias-propiedades, u1-numeros-reales]
---

# Potencias, raíces y logaritmos

*Unidad 1 · Lección 2 — Segundo medio*

Tres nombres para tres preguntas sobre la misma igualdad:

```
2⁵ = 32

  ¿cuánto vale 2⁵?        →  la potencia      →  32
  ¿qué número al 5 da 32? →  la raíz          →  ⁵√32 = 2
  ¿a qué exponente hay
   que elevar 2 para
   obtener 32?            →  el logaritmo     →  log₂ 32 = 5
```

Esa tabla es toda la lección. Lo demás son consecuencias.

## Potencias y raíces

::actividad{tipo=potencias base=2 exponente=5 titulo="Recuerda: mueve la base y el exponente"}

### Exponente racional

La idea que une las dos primeras columnas: una raíz **es** una potencia.

```
a^(1/n) = ⁿ√a            a^(m/n) = ⁿ√(aᵐ) = (ⁿ√a)ᵐ
```

Por qué tiene que ser así: si las propiedades de las potencias valen también para
exponentes fraccionarios, entonces

```
(a^(1/2))² = a^(1/2 · 2) = a¹ = a
```

y el número que al cuadrado da a es justamente √a. La definición no es un capricho:
es la única que mantiene las propiedades que ya existían.

**Ejemplos.**

```
8^(2/3) = ³√(8²) = ³√64 = 4      (o (³√8)² = 2² = 4, más fácil)
27^(−1/3) = 1 / ³√27 = 1/3
16^(0,75) = 16^(3/4) = (⁴√16)³ = 2³ = 8
```

Conviene sacar primero la raíz y después elevar: los números se quedan pequeños.

### Las propiedades, ahora con cualquier exponente

| Propiedad | Ejemplo con fracciones |
|---|---|
| aᵐ · aⁿ = aᵐ⁺ⁿ | 2^(1/2) · 2^(3/2) = 2² = 4 |
| aᵐ ÷ aⁿ = aᵐ⁻ⁿ | 5^(5/3) ÷ 5^(2/3) = 5¹ = 5 |
| (aᵐ)ⁿ = aᵐⁿ | (9^(1/2))³ = 3³ = 27 |
| (ab)ⁿ = aⁿbⁿ | (4·25)^(1/2) = 2 · 5 = 10 |

## Logaritmos

El **logaritmo en base b de x** es el exponente al que hay que elevar b para
obtener x:

```
log_b x = y      ⟺      b^y = x        (b > 0, b ≠ 1, x > 0)
```

Las condiciones no son burocracia:

- **x > 0** porque bʸ siempre es positivo: no hay exponente que haga que 2 elevado
  a algo dé −8, ni que dé 0. Por eso log de un número negativo o de cero **no
  existe**.
- **b ≠ 1** porque 1 elevado a lo que sea da 1, y la pregunta no tendría respuesta
  única.

### Los que se usan

| Escritura | Base | Nombre |
|---|---|---|
| log x | 10 | logaritmo decimal |
| ln x | e ≈ 2,718 | logaritmo natural |
| log₂ x | 2 | binario, en informática |

### Las propiedades

Cada una es una propiedad de las potencias mirada del otro lado. Multiplicar
números se convierte en sumar sus logaritmos, y ese fue durante siglos su uso: era
la calculadora antes de la calculadora.

```
log(a · b) = log a + log b            log(100 · 1000) = 2 + 3 = 5
log(a ÷ b) = log a − log b            log(100 ÷ 1000) = 2 − 3 = −1
log(aⁿ)    = n · log a                log(10³) = 3 · 1 = 3
log_b b    = 1        log_b 1 = 0
```

**No existe ninguna propiedad para la suma.** log(a + b) no es log a + log b, y se
comprueba igual que con las raíces: log(10 + 10) = log 20 ≈ 1,3, mientras que
log 10 + log 10 = 2.

### Cambio de base

La calculadora solo trae log y ln, así que cualquier otra base se convierte:

```
            log x           log 32     1,505
log_b x = ─────────    →   ───────  = ─────── = 5
            log b           log 2      0,301
```

### Ecuaciones sencillas

Se resuelven pasando de una forma a la otra:

```
log₃ x = 4        →   x = 3⁴ = 81
2ˣ = 40           →   x = log₂ 40 = log 40 / log 2 ≈ 5,32
log(x + 3) = 2    →   x + 3 = 10²   →   x = 97
```

Con logaritmos hay que **comprobar la solución**: log(x − 5) = 1 da x = 15, pero si
una ecuación llevara a x = 2, habría que descartarla, porque log(−3) no existe.

## Dónde se usan de verdad

Los logaritmos aparecen cuando una magnitud crece multiplicándose y hace falta una
escala manejable:

- **Terremotos (Richter).** Un grado más es unas 32 veces más energía. Un 7 no es
  «un poco peor» que un 6.
- **Sonido (decibelios).** 10 dB más es diez veces más intensidad.
- **pH.** Es −log de la concentración de iones de hidrógeno. Un pH de 3 es diez
  veces más ácido que uno de 4.
- **Interés compuesto.** ¿En cuántos años se duplica un capital al 5 %? Se resuelve
  con log.

## Errores frecuentes

- **log(a + b) = log a + log b.** No existe esa propiedad.
- **Escribir log 0 o el log de un negativo.** No existen.
- **Confundir log(aⁿ) con (log a)ⁿ.** El primero es n·log a; el segundo, otra cosa.
- **Con exponente fraccionario, elevar antes de sacar la raíz.** 8^(2/3) se hace
  mejor como (³√8)² = 4 que como ³√64.
- **Olvidar comprobar la solución** en una ecuación logarítmica.
