---
titulo: Ejercicios combinados, con y sin paréntesis
materia: matematicas
categoria: Números y operaciones
descripcion: El orden de las operaciones y cómo un paréntesis cambia el resultado.
bandas: [11-12]
orden: 105
---

# Ejercicios combinados, con y sin paréntesis

Cuando en una misma expresión hay varias operaciones, el resultado depende del
orden en que se hagan. Para que no haya dos respuestas válidas existe un orden
acordado.

## El orden

1. **Paréntesis**, de dentro hacia fuera.
2. **Potencias y raíces**.
3. **Multiplicaciones y divisiones**, de izquierda a derecha.
4. **Sumas y restas**, de izquierda a derecha.

Los pasos 3 y 4 dicen «de izquierda a derecha» y eso importa de verdad:

```
20 ÷ 5 × 2  =  4 × 2  =  8         ← correcto
20 ÷ 5 × 2  =  20 ÷ 10 = 2         ← incorrecto
```

La multiplicación no va antes que la división: van juntas, en el orden en que
aparecen. Lo mismo con la suma y la resta.

## Sin paréntesis y con paréntesis

Es la misma expresión y dan resultados distintos:

```
2 + 3 × 4        = 2 + 12  = 14
(2 + 3) × 4      = 5 × 4   = 20
```

```
10 − 4 − 3       = 6 − 3   = 3
10 − (4 − 3)     = 10 − 1  = 9
```

El paréntesis no es decoración: es una instrucción que cambia la respuesta.

## Un ejercicio paso a paso

```
15 + 2 · (8 − 3)² ÷ 5
```

| Paso | Qué se hace | Queda |
|---|---|---|
| 1 | el paréntesis: 8 − 3 | 15 + 2 · 5² ÷ 5 |
| 2 | la potencia: 5² | 15 + 2 · 25 ÷ 5 |
| 3 | multiplicar y dividir, de izquierda a derecha | 15 + 50 ÷ 5 → 15 + 10 |
| 4 | sumar | **25** |

Escribir la expresión completa en cada paso, y no solo el número, es lo que permite
encontrar el error después. Quien escribe solo resultados no puede revisar.

## Paréntesis dentro de paréntesis

Se resuelven de dentro hacia fuera:

```
2 · [3 + (10 − 4 · 2)]  =  2 · [3 + (10 − 8)]  =  2 · [3 + 2]  =  2 · 5  =  10
```

## Errores frecuentes

- **Hacer la multiplicación antes de la división cuando la división está a la
  izquierda.** Van en el orden en que aparecen.
- **Resolver de izquierda a derecha sin respetar la jerarquía.** 2 + 3 × 4 no es 20.
- **Perder el signo al quitar un paréntesis precedido de menos.** 10 − (4 − 3) es
  10 − 4 + 3 = 9, no 10 − 4 − 3.
- **Confiar en la calculadora sin comprobar.** Las buenas respetan la jerarquía; las
  más simples calculan en el orden en que se teclea y dan otro resultado. Conviene
  probar `2 + 3 × 4` en la que se use: si contesta 20, hay que poner los paréntesis
  a mano siempre.
