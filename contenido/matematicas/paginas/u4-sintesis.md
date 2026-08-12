---
titulo: Síntesis · Unidad 4 · Probabilidad y estadística
materia: matematicas
categoria: (Segundo medio) Unidad 4 · Probabilidad y estadística
descripcion: Lo esencial del conteo y la probabilidad, y por qué aquí la intuición falla tanto.
bandas: [14-15, 16-17]
orden: 530
refuerzo: [u4-tecnicas-de-conteo, u4-calculo-de-probabilidades]
---

# Síntesis · Unidad 4 · Probabilidad y estadística

*Segundo medio*

## El mapa de la unidad

```
CONTAR                          ¿importa el orden?
  sí, todos      → n!
  sí, algunos    → n!/(n−r)!
  sí, repitiendo → nʳ
  no             → n!/(r!(n−r)!)

CALCULAR
  P(A)      = favorables / posibles        (si son equiprobables)
  P(no A)   = 1 − P(A)                     ← el atajo de «al menos»
  P(A o B)  = P(A) + P(B) − P(A y B)
  P(A y B)  = P(A) · P(B)                  solo si son independientes
```

## Lo esencial en cinco líneas

1. Contar viene antes de calcular: la regla de Laplace es una división, y lo difícil
   es conseguir los dos números.
2. **La pregunta que decide la fórmula es si importa el orden.** Se responde con la
   prueba del intercambio, no con la fórmula en la mano.
3. Ante «al menos uno», mira siempre el suceso contrario.
4. Multiplicar probabilidades exige **independencia**. Sin reposición no la hay.
5. La intuición falla sistemáticamente en probabilidad, y eso no es un defecto
   personal: es la razón de que esta unidad exista.

## Comprueba si lo entendiste

| Pregunta | Si cuesta, vuelve a |
|---|---|
| Un podio de 3 entre 8, y una comisión de 3 entre 8: ¿por qué no dan lo mismo? | Técnicas de conteo |
| ¿Por qué CASA tiene 12 ordenaciones y no 24? | Técnicas de conteo |
| ¿Por qué C(20,18) se calcula mejor como C(20,2)? | Técnicas de conteo |
| Tras cinco caras seguidas, ¿qué probabilidad tiene la sexta? ¿Por qué? | Cálculo de probabilidades |
| Una prueba que acierta el 99 % sale positiva. ¿Estás enfermo con un 99 %? | Cálculo de probabilidades |
| ¿Por qué en un curso de 30 es probable que dos cumplan el mismo día? | Cálculo de probabilidades |

Las tres últimas son las importantes de la unidad. Ninguna se responde con una
fórmula: se responden pensando en **cuántos casos hay de cada clase**.

## Los cinco errores que más cuestan

| Error | Cómo se detecta |
|---|---|
| Permutaciones donde iban combinaciones | el resultado sale demasiado grande; ¿el intercambio cambia algo? |
| Multiplicar sucesos dependientes | ¿se devolvió la carta? |
| Sumar sin restar la intersección | si el total pasa de 1, ahí está |
| Creer que el azar compensa | la moneda no recuerda nada |
| Olvidar la frecuencia base | el caso de la prueba médica: la mitad, no el 99 % |

## Por qué esta unidad importa fuera del colegio

Las otras tres unidades dan herramientas. Esta, además, corrige una intuición que
falla y que se usa a diario: al leer una noticia con porcentajes, al comprar un
seguro, al interpretar un resultado médico, al decidir si una lotería vale la pena.

El caso de la prueba médica es el resumen de todo: un número correcto —el 99 % de
acierto— lleva a una conclusión falsa cuando se olvida cuántos había de cada clase
al principio. Saber eso no es saber una fórmula; es saber qué preguntar.

## Con esto cierra segundo medio

```
Unidad 1  Números              ℝ, raíces y logaritmos
Unidad 2  Álgebra y funciones  la cuadrática y la inversa
Unidad 3  Geometría            trigonometría del triángulo rectángulo
Unidad 4  Probabilidad         contar y calcular el azar
```

Las cuatro se apoyan en la primera: hay raíces en la fórmula cuadrática, raíces en
la hipotenusa, y divisiones que hay que aproximar en cada probabilidad.
