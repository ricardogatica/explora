---
titulo: Medidas de tendencia central
materia: matematicas
categoria: Datos y probabilidad
descripcion: Media, mediana y moda: cómo se calculan y cuándo cada una engaña.
bandas: [13-14]
orden: 132
---

# Medidas de tendencia central

Son tres formas de resumir un conjunto de datos en un solo número. No compiten: cada
una dice algo distinto, y elegir la equivocada es la manera más fácil de mentir con
datos sin decir ninguna falsedad.

## Las tres

**Media** (o promedio): se suman todos los datos y se divide por cuántos son.

```
media = suma de los datos ÷ cantidad de datos
```

**Mediana**: se ordenan los datos y se toma el del medio. Si hay una cantidad par,
es el promedio de los dos centrales.

**Moda**: el valor que más se repite. Puede no haber ninguna, o haber varias.

## Un ejemplo con los tres

Notas de 7 estudiantes: **4, 5, 5, 6, 6, 6, 7**

| Medida | Cálculo | Resultado |
|---|---|---|
| media | (4+5+5+6+6+6+7) ÷ 7 = 39 ÷ 7 | 5,57 |
| mediana | ya ordenados, el 4.º de 7 | 6 |
| moda | el 6 aparece tres veces | 6 |

## Cuándo la media engaña

Sueldos mensuales de cinco personas de una empresa, en miles de pesos:

**300, 320, 350, 380, 2 000**

| Medida | Resultado |
|---|---|
| media | 670 |
| mediana | 350 |

La media dice 670, y **cuatro de las cinco personas ganan menos que eso**. No es un
error de cálculo: la media se deja arrastrar por un valor extremo, y aquí ese valor
es el sueldo del jefe.

La mediana no se mueve: da 350, que describe mucho mejor lo que gana la gente de esa
empresa. Por eso los informes de ingresos y de precios de vivienda serios publican
la **mediana**, no el promedio.

## Cuál usar

| Situación | Conviene |
|---|---|
| datos parejos, sin extremos | la media |
| hay valores muy extremos (sueldos, precios) | la mediana |
| la variable es cualitativa (color, deporte) | la moda, la única posible |
| se quiere el valor más común | la moda |

## Errores frecuentes

- **Usar «promedio» como si fuera siempre lo más representativo.** Con un valor
  extremo deja de serlo.
- **Creer que la media tiene que ser uno de los datos.** El promedio de hijos puede
  ser 2,3 y nadie tiene 2,3 hijos.
- **Calcular la mediana sin ordenar primero.** Es el error más común de todos, y no
  avisa: sale un número perfectamente creíble.
- **Buscar la moda donde no hay.** En 3, 5, 7, 9 ningún valor se repite: no hay moda,
  y eso es una respuesta válida.
- **Resumir con un solo número datos muy dispersos.** Dos cursos pueden tener el
  mismo promedio 5,5 y ser completamente distintos: uno con todos en 5 y 6, otro con
  la mitad en 2 y la mitad en 7. Para eso hacen falta medidas de dispersión.
