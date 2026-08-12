---
titulo: Regla de Laplace
materia: matematicas
categoria: Datos y probabilidad
descripcion: Calcular probabilidades contando casos, y saber cuándo la regla no se puede aplicar.
bandas: [16-17]
orden: 136
---

# Regla de Laplace

Cuando todos los resultados de un experimento son **igualmente probables**, la
probabilidad de un suceso se calcula contando:

```
P(A) = casos favorables ÷ casos posibles
```

El resultado siempre queda entre 0 y 1: 0 es imposible, 1 es seguro. Se puede
expresar como fracción, decimal o porcentaje: 1/2 = 0,5 = 50 %.

## Ejemplos directos

| Experimento | Suceso | Cálculo | P |
|---|---|---|---|
| un dado | sacar un 4 | 1/6 | 0,167 |
| un dado | sacar par | 3/6 | 0,5 |
| un dado | sacar menos que 5 | 4/6 | 0,667 |
| una carta de 52 | que sea de corazones | 13/52 | 0,25 |
| una carta de 52 | que sea un as | 4/52 | 0,077 |

Todo el trabajo está en contar bien, y contar bien es más difícil de lo que parece.

## La condición que casi nadie comprueba

La regla exige que **todos los casos sean igual de probables**. Con un dado normal lo
son. En cambio:

**Dos dados y la suma.** Los resultados posibles de la suma van del 2 al 12, once
valores. La tentación es decir que P(suma = 7) = 1/11. Es falso, y la razón es que
esos once valores **no** son igual de probables:

| Suma | Formas de obtenerla | P |
|---|---|---|
| 2 | 1+1 | 1/36 |
| 7 | 1+6, 2+5, 3+4, 4+3, 5+2, 6+1 | 6/36 = 1/6 |
| 12 | 6+6 | 1/36 |

El 7 es **seis veces más probable** que el 2. Lo que sí es equiprobable son los 36
pares ordenados de caras, y es sobre esos 36 sobre los que hay que contar.

**Un dado cargado.** Si el dado está trucado, la regla de Laplace no sirve en
absoluto. Ahí hay que estimar las probabilidades tirándolo muchas veces y viendo qué
sale: eso es probabilidad **frecuencial**, no clásica.

## Suceso contrario

A menudo es mucho más rápido contar lo que **no** pasa:

```
P(A) = 1 − P(no A)
```

Al lanzar tres monedas, la probabilidad de sacar **al menos una cara** obligaría a
contar tres casos. Pero lo contrario de «al menos una cara» es «ninguna cara», que
es un solo caso, SSS, con probabilidad 1/8. Entonces:

```
P(al menos una cara) = 1 − 1/8 = 7/8
```

Cuando en el enunciado aparece «al menos», conviene mirar primero el contrario.

## Errores frecuentes

- **Aplicar la regla sin que los casos sean equiprobables.** Es el error grande, y el
  de la suma de dos dados es el ejemplo clásico.
- **Contar mal los casos posibles.** Con dos dados son 36, no 12 ni 11.
- **Dar una probabilidad mayor que 1.** Si sale, es que los favorables se contaron
  entre un total equivocado.
- **La falacia del jugador.** Después de cuatro rojos en la ruleta, el rojo sigue
  teniendo la misma probabilidad. Los resultados anteriores no cambian nada.
- **Confundir «poco probable» con «imposible».** Sacar 12 con dos dados pasa una vez
  cada 36 tiradas, y pasa.
