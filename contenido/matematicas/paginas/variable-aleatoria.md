---
titulo: Variable aleatoria
materia: matematicas
categoria: Datos y probabilidad
descripcion: Poner números a los resultados del azar, su distribución y el valor esperado.
bandas: [15-17]
orden: 135
---

# Variable aleatoria

Una **variable aleatoria** asigna un número a cada resultado posible de un
experimento al azar. Sirve para poder calcular con lo que antes eran palabras.

Al lanzar dos monedas los resultados son CC, CS, SC, SS. Eso no se puede sumar ni
promediar. Pero si se define

> X = cantidad de caras

entonces cada resultado tiene un número: CC → 2, CS → 1, SC → 1, SS → 0. Y con
números ya se puede trabajar.

## Discretas y continuas

| Clase | Qué valores toma | Ejemplos |
|---|---|---|
| **discreta** | valores separados, contables | caras en 3 lanzamientos, goles, hijos |
| **continua** | cualquier valor de un intervalo | estatura, tiempo de espera, temperatura |

## La distribución de probabilidad

Es la lista de todos los valores que puede tomar la variable con la probabilidad de
cada uno. Para X = cantidad de caras al lanzar dos monedas:

| X | Resultados que dan ese valor | P(X) |
|---|---|---|
| 0 | SS | 1/4 = 0,25 |
| 1 | CS, SC | 2/4 = 0,50 |
| 2 | CC | 1/4 = 0,25 |
| | | **suma = 1** |

Dos condiciones que toda distribución cumple, y que sirven para comprobarla:

- Ninguna probabilidad es negativa ni mayor que 1.
- **La suma de todas es exactamente 1.**

Que el 1 sea el doble de probable que el 0 no es una rareza: hay dos formas de
sacar una cara y solo una de no sacar ninguna. Contar los casos es todo el trabajo.

## Valor esperado

Es el promedio que se obtendría repitiendo el experimento muchísimas veces. Se
calcula multiplicando cada valor por su probabilidad y sumando:

```
E(X) = 0 · 0,25 + 1 · 0,50 + 2 · 0,25 = 1
```

Al lanzar dos monedas, lo esperable es una cara. Tiene sentido: la mitad de dos.

**El valor esperado no tiene que ser un resultado posible.** Al lanzar un dado:

```
E(X) = (1+2+3+4+5+6) / 6 = 3,5
```

Y no hay ninguna cara con 3,5. Eso no invalida el cálculo: es el promedio a la
larga, no una predicción de la próxima tirada.

## Para qué sirve de verdad

El valor esperado es lo que permite decidir si un juego conviene. Un juego donde se
paga 100 por lanzar un dado y se cobra 20 veces el número que salga tiene un valor
esperado de 20 × 3,5 = 70 por jugada: se pierden 30 de media cada vez. Así funcionan
los seguros y los casinos, en direcciones opuestas.

## Errores frecuentes

- **Que las probabilidades no sumen 1.** Casi siempre significa que falta un caso.
- **Esperar que el valor esperado sea un resultado posible.**
- **Creer que el valor esperado dice qué va a pasar la próxima vez.** Dice el
  promedio de muchas veces.
- **Confundir la variable con su probabilidad.** X es el número de caras; P(X) es lo
  probable que sea ese número.
- **La falacia del jugador:** creer que después de cinco cruces «toca» cara. La
  moneda no recuerda nada; sigue siendo 1/2.
