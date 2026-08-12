---
titulo: Medir: unidades e incertidumbre
materia: fisica
categoria: Método
descripcion: El sistema internacional, cifras significativas y por qué toda medida lleva un margen.
bandas: [16-17]
orden: 150
---

# Medir: unidades e incertidumbre

Un número sin unidad no dice nada, y una medida sin margen de error finge una
precisión que no tiene. Las dos cosas se aprenden midiendo, no leyendo.

## El sistema internacional

Siete unidades básicas sostienen todas las demás:

| Magnitud | Unidad | Símbolo |
|---|---|---|
| longitud | metro | m |
| masa | kilogramo | kg |
| tiempo | segundo | s |
| corriente eléctrica | amperio | A |
| temperatura | kelvin | K |
| cantidad de sustancia | mol | mol |
| intensidad luminosa | candela | cd |

Todo lo demás se deriva: el newton es kg·m/s², el julio es N·m, el vatio es J/s.
Comprobar que las unidades cuadran a los dos lados de una ecuación es la forma más
rápida de cazar un error, y funciona sin saber resolver el problema.

## Toda medida tiene un margen

Medir la mesa con una cinta de milímetros da, por ejemplo, 1,214 m. No es 1,214000
m: es 1,214 m con un margen de un milímetro o dos. Se escribe así:

```
largo = 1,214 ± 0,002 m
```

El margen no es un fallo de quien mide: es parte del resultado. Una medida sin
margen no se puede comparar con otra.

## Cifras significativas

El resultado de un cálculo no puede tener más precisión que el dato peor medido.

- 2,5 cm × 3,42 cm = 8,55 cm², que se escribe **8,6 cm²**: el 2,5 solo tiene dos
  cifras significativas y el resultado no puede tener tres.
- Una calculadora que devuelve 8,55000 no está midiendo; está dividiendo.

Este es el error más común en un laboratorio escolar: copiar los diez decimales de
la pantalla como si todos significaran algo.

## Exactitud y precisión no son lo mismo

| | Significa | Se arregla |
|---|---|---|
| exactitud | qué cerca está del valor real | calibrando el instrumento |
| precisión | qué parecidas salen las repeticiones | mejorando el método |

Una báscula descalibrada que siempre suma 3 kg es muy **precisa** (repite el mismo
número) y nada **exacta**. Es el peor caso, porque no se nota repitiendo la medida:
se nota solo comparando con otra báscula.

## Errores frecuentes

- **Dar un resultado sin unidad.** «La respuesta es 9,8» no es una respuesta.
- **Copiar todos los decimales de la calculadora.**
- **Confundir el error del instrumento con haberlo hecho mal.** Toda medida tiene
  incertidumbre; declararla es hacerlo bien, no confesar un fallo.
- **Repetir una medida y creer que eso corrige un instrumento mal calibrado.**
  Repetir mejora la precisión, no la exactitud.
