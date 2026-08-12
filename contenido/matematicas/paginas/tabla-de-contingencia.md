---
titulo: Tabla de contingencia (doble entrada)
materia: matematicas
categoria: Datos y probabilidad
descripcion: Cruzar dos variables, leer los totales marginales y comparar con porcentajes.
bandas: [16-17]
orden: 133
---

# Tabla de contingencia (doble entrada)

Sirve para cruzar **dos variables a la vez** y ver si tienen relación. Una va en las
filas y otra en las columnas; en cada casilla se cuenta cuántos individuos cumplen
las dos cosas.

## Un ejemplo completo

Se pregunta a 50 estudiantes de dos cursos por su deporte favorito.

| | Fútbol | Básquetbol | **Total** |
|---|---|---|---|
| **1.º medio** | 18 | 7 | **25** |
| **2.º medio** | 12 | 13 | **25** |
| **Total** | **30** | **20** | **50** |

Cómo se lee:

- **Cada casilla** cruza las dos variables: 18 estudiantes son de 1.º **y** prefieren
  fútbol.
- La fila y la columna de totales se llaman **marginales**: 30 prefieren fútbol en
  total, 25 son de 1.º en total.
- La casilla de abajo a la derecha es el total general, y tiene que dar lo mismo
  sumando por filas que por columnas. **Es la comprobación de que la tabla está bien
  construida**: 18+7+12+13 = 50, 25+25 = 50, 30+20 = 50.

## Comparar hace falta porcentajes

En números absolutos parece que el fútbol gana en los dos cursos. Con porcentajes
**por fila** se ve otra cosa:

| | Fútbol | Básquetbol |
|---|---|---|
| **1.º medio** | 18/25 = **72 %** | 28 % |
| **2.º medio** | 12/25 = **48 %** | 52 % |

En 1.º el fútbol arrasa; en 2.º van casi empatados y el básquetbol va ligeramente
por delante. Los porcentajes por fila responden a «dentro de cada curso, qué
prefieren», que es casi siempre la pregunta que interesa.

Cuidado con la dirección: porcentajes **por columna** responden a otra pregunta
distinta —«de los que prefieren fútbol, cuántos son de 1.º»— y dan otros números.
Antes de dividir hay que decidir qué se está preguntando.

## Cuándo hay relación entre las dos variables

Si el reparto es **parecido** en todas las filas, las variables no tienen relación:
el curso no dice nada del deporte. Si es **distinto** entre filas, como en el
ejemplo, hay relación.

En este caso, con 50 estudiantes, la diferencia entre 72 % y 48 % es grande. Con
muestras pequeñas conviene desconfiar: dos o tres respuestas de más pueden mover un
porcentaje muchísimo.

## Errores frecuentes

- **Que los totales no cuadren.** Si sumando filas y columnas no sale lo mismo, hay
  un dato mal puesto. Comprobarlo cuesta diez segundos.
- **Comparar casillas de filas con distinto total.** 18 y 12 no se comparan
  directamente si las filas tuvieran 25 y 40 estudiantes.
- **Calcular los porcentajes en la dirección equivocada** y responder a una pregunta
  distinta de la que se hizo.
- **Confundir relación con causa.** Que en 1.º prefieran fútbol no significa que
  estar en 1.º cause esa preferencia.
