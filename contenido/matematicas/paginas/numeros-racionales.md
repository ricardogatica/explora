---
titulo: Números racionales
materia: matematicas
categoria: Números y operaciones
descripcion: Fracciones y decimales, equivalencia, comparación y las cuatro operaciones.
bandas: [11-12]
orden: 103
---

# Números racionales

Un **racional** es todo número que se puede escribir como una fracción de enteros:

```
a / b      con b ≠ 0
```

Se representan con la letra **ℚ**. Ahí dentro están los enteros (5 = 5/1), las
fracciones (3/4) y los decimales que terminan o que se repiten (0,25 y 0,333…).

El **b ≠ 0** no es un capricho: dividir por cero no da infinito, no da nada. Si
6/0 valiera algún número *n*, entonces n × 0 tendría que ser 6, y cualquier número
por cero da cero.

## Cómo se construye uno

Se eligen dos números enteros y se pone uno sobre otro. Eso es todo, y cada uno
tiene su papel:

- El de **abajo** —el denominador— dice **en cuántos trozos se corta el entero**.
- El de **arriba** —el numerador— dice **cuántos de esos trozos se toman**.

Los dos papeles no son intercambiables, y de ahí sale la sorpresa: subir el
denominador hace la fracción **más pequeña**, porque los trozos son más finos.

::actividad{tipo=racionales numerador=3 denominador=4 titulo="Constrúyela: cuántos trozos tomas, y de cuántos"}

## Ejemplos, y de dónde salen

Todos estos son racionales, aunque no lo parezcan a primera vista:

| Número | Como fracción | De dónde sale |
|---|---|---|
| 7 | 7/1 | todo entero lo es: cortar en una parte es no cortar |
| 0,5 | 1/2 | media pizza |
| 0,75 | 3/4 | tres cuartos de hora, 45 minutos |
| 2,5 | 5/2 | dos litros y medio |
| 0,333… | 1/3 | un tercio de un chocolate de tres onzas |
| −4 | −4/1 | cuatro grados bajo cero |
| −0,2 | −1/5 | un quinto por debajo |
| 0 | 0/9 | cero trozos de lo que sea |
| 0,125 | 1/8 | un octavo de tarta |

Y estos **no** lo son, por más que se parezcan:

| Número | Por qué no |
|---|---|
| π = 3,14159… | sus decimales no terminan ni se repiten nunca |
| √2 = 1,41421… | igual: infinitos decimales sin ningún patrón |

La diferencia no es que tengan muchos decimales. 1/3 también tiene infinitos. La
diferencia es que los de 1/3 **se repiten**, y los de π no.

## De decimal a fracción, y al revés

Las dos direcciones se recorren, y saber hacerlo en los dos sentidos es lo que
convence de que son el mismo número escrito de dos maneras.

**De fracción a decimal:** se divide. 3 ÷ 4 = 0,75.

**De decimal exacto a fracción:** se escribe sobre la potencia de 10 que
corresponda y se simplifica.

```
0,75  =  75/100  =  3/4        (dos decimales → entre 100)
0,4   =  4/10    =  2/5
0,125 = 125/1000 =  1/8
```

**De decimal periódico a fracción:** hay un truco que parece magia y no lo es.

```
Sea x = 0,333…
Entonces  10x = 3,333…
Restando:  9x = 3          (los decimales infinitos se cancelan)
Luego       x = 3/9 = 1/3
```

Funciona porque los dos números tienen exactamente la misma cola infinita, y al
restar desaparece. Con 0,8333… se multiplica por 10 y por 100 en vez de por 10 y 1,
pero la idea es la misma.

## Dónde aparecen sin avisar

Casi siempre que se mide o se reparte:

- **Media hora** son 1/2 h; **un cuarto de hora**, 1/4 h. El reloj está lleno de
  fracciones.
- **Una receta para 6 que se hace para 4**: todo se multiplica por 4/6 = 2/3.
- **Un descuento del 25 %** es multiplicar por 3/4.
- **Un partido va 2 de 3 sets**: eso es 2/3.
- **Un tornillo de 3/8 de pulgada**: la ferretería sigue midiendo en fracciones.

## Fracción y decimal son la misma cosa

Toda fracción se convierte en decimal dividiendo, y el resultado solo puede ser de
dos clases:

| Fracción | Decimal | Clase |
|---|---|---|
| 3/4 | 0,75 | exacto |
| 1/3 | 0,333… | periódico |
| 5/8 | 0,625 | exacto |
| 2/7 | 0,285714285714… | periódico |

**Nunca sale un decimal infinito sin repetirse.** Ese es justo el borde de los
racionales: números como π o √2 tienen infinitos decimales sin patrón, y por eso no
son racionales sino **irracionales**.

## Fracciones equivalentes

Multiplicar o dividir arriba y abajo por lo mismo no cambia el valor:

```
1/2  =  2/4  =  3/6  =  50/100
```

Simplificar es hacer el camino de vuelta hasta que no queden factores comunes:
18/24 → divide arriba y abajo por 6 → **3/4**.

## Comparar

Con el mismo denominador, gana el numerador mayor: 3/7 < 5/7.

Con denominadores distintos hay que igualarlos. Para comparar 3/5 y 5/8:

```
3/5 = 24/40        5/8 = 25/40        →   3/5 < 5/8
```

## Las cuatro operaciones

| Operación | Regla | Ejemplo |
|---|---|---|
| suma y resta | igualar denominadores primero | 1/4 + 2/3 = 3/12 + 8/12 = 11/12 |
| multiplicación | numerador por numerador, denominador por denominador | 2/3 × 3/5 = 6/15 = 2/5 |
| división | multiplicar por la fracción dada la vuelta | 2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6 |

La multiplicación es la fácil y la suma es la difícil, al revés que con los números
enteros. Eso explica por qué el error más común es sumar como se multiplica.

## Errores frecuentes

- **Sumar numeradores y denominadores.** 1/2 + 1/3 **no** es 2/5. Se comprueba con
  cualquier ejemplo: media pizza más un tercio es más que media, y 2/5 es menos.
- **Creer que multiplicar siempre agranda.** 1/2 × 1/2 = 1/4, que es menor que los
  dos factores.
- **Creer que dividir siempre reduce.** 6 ÷ 1/2 = 12: ¿cuántas mitades hay en 6?
- **Pensar que un denominador mayor es un número mayor.** 1/8 es menor que 1/3:
  cuantos más trozos, más pequeño cada uno.
