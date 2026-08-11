---
titulo: Potencias de base 10
materia: matematicas
categoria: Números y operaciones
descripcion: El patrón de los ceros, el valor posicional y cómo se escriben números muy grandes.
bandas: [11-12]
orden: 104
---

# Potencias de base 10

Entre todas las bases, el 10 tiene un sitio aparte: es la base con la que está
construido nuestro sistema de escribir números. Por eso sus potencias tienen un
patrón que se ve a simple vista.

## El patrón de los ceros

```
10¹ = 10                    10⁴ = 10 000
10² = 100                   10⁵ = 100 000
10³ = 1 000                 10⁶ = 1 000 000
```

**El exponente es la cantidad de ceros.** 10⁹ es un 1 seguido de nueve ceros: mil
millones.

Esa regla vale **solo** para la base 10, y ahí está su interés: es lo que hace que
nuestro sistema de numeración sea cómodo, y no una propiedad de las potencias en
general. 2⁵ = 32 no tiene ningún cero.

::actividad{tipo=potencias base=10 exponente=3 titulo="Pon la base en 10 y mueve el exponente"}

## Valor posicional

Cada posición de un número es una potencia de 10, y eso es exactamente lo que
significa el valor posicional que se aprende antes:

```
4 725  =  4 · 10³  +  7 · 10²  +  2 · 10¹  +  5 · 10⁰
       =  4 · 1000 +  7 · 100  +  2 · 10   +  5 · 1
```

La columna de las unidades es 10⁰ = 1. Así se ve que el 10⁰ = 1 no es un capricho:
si valiera otra cosa, la escritura de los números no funcionaría.

## Hacia el otro lado: los decimales

Bajando del exponente 0 aparecen los decimales, y el patrón sigue:

| Potencia | Vale | Se llama |
|---|---|---|
| 10² | 100 | cien |
| 10¹ | 10 | diez |
| 10⁰ | 1 | uno |
| 10⁻¹ | 0,1 | una décima |
| 10⁻² | 0,01 | una centésima |
| 10⁻³ | 0,001 | una milésima |

Cada escalón hacia abajo divide por 10, sin excepción y sin cambio de regla en
ningún punto. El exponente negativo no da un número negativo: da un número
pequeño.

## Multiplicar y dividir por potencias de 10

Es mover la coma, y saber por qué evita memorizarlo al revés:

| Operación | Qué pasa | Ejemplo |
|---|---|---|
| × 10 | la coma se mueve un lugar a la derecha | 3,45 × 10 = 34,5 |
| × 1000 | tres lugares a la derecha | 3,45 × 1000 = 3 450 |
| ÷ 100 | dos lugares a la izquierda | 3,45 ÷ 100 = 0,0345 |

## Números que hacen falta en el mundo real

Cuando las cifras son muchas, contar ceros deja de funcionar:

| Cantidad | Con potencias de 10 |
|---|---|
| población de Chile, unos 19 millones | 1,9 · 10⁷ |
| distancia a la Luna, 384 400 km | 3,844 · 10⁵ km |
| tamaño de un virus, 0,0000001 m | 10⁻⁷ m |

Escribirlos así es el paso previo a la notación científica, que se ve más adelante.

## Errores frecuentes

- **Aplicar la regla de los ceros a otras bases.** Solo vale para el 10.
- **Creer que 10⁻² es −100.** Es 0,01. El signo del exponente no es el signo del
  resultado.
- **Mover la coma al revés.** Multiplicar agranda, así que la coma va a la
  derecha. Si el resultado sale más pequeño, se movió mal.
- **Olvidar el 10⁰ al descomponer un número.** La columna de las unidades también
  es una potencia de 10.
