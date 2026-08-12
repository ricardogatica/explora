---
titulo: Cálculo de probabilidades
materia: matematicas
categoria: (Segundo medio) Unidad 4 · Probabilidad y estadística
descripcion: Unión, intersección, complemento e independencia, y cómo se usan las probabilidades fuera de clase.
bandas: [15-17]
orden: 520
refuerzo: [u4-tecnicas-de-conteo, regla-de-laplace]
---

# Cálculo de probabilidades

*Unidad 4 · Lección 2 — Segundo medio*

## Probabilidades y azar

La probabilidad de un suceso es un número entre 0 y 1: 0 es imposible, 1 es seguro.
Cuando todos los resultados son igualmente probables se cuenta:

```
             casos favorables
P(A) = ──────────────────────────
             casos posibles
```

Contar es justo lo que se aprendió en la lección anterior, y por eso va antes.

**Ejemplo.** Con las técnicas de conteo: en el Loto, elegir 6 de 41.

```
P(acertar los 6) = 1 / C(41,6) = 1 / 4 496 388 ≈ 0,000022 %
```

### Las reglas

**Complemento.** Casi siempre el atajo:

```
P(no A) = 1 − P(A)
```

Con «al menos uno» conviene mirar siempre el contrario. Al lanzar 3 dados, la
probabilidad de sacar al menos un 6 obligaría a contar tres casos; lo contrario
—ningún 6— es uno solo:

```
P(al menos un 6) = 1 − (5/6)³ = 1 − 125/216 = 91/216 ≈ 42 %
```

**Unión: «o».**

```
P(A o B) = P(A) + P(B) − P(A y B)
```

Se resta la intersección porque si no, lo común se cuenta dos veces. Con una carta
de 52: P(corazón o figura) = 13/52 + 12/52 − 3/52 = 22/52, y esos 3 son las tres
figuras de corazones.

Si los sucesos son **incompatibles** (no pueden pasar juntos), la intersección es
cero y se suman sin más.

**Intersección: «y».**

```
P(A y B) = P(A) · P(B)        solo si son independientes
```

**Independientes** significa que uno no cambia la probabilidad del otro. Dos
lanzamientos de moneda lo son; sacar dos cartas sin devolver la primera, no.

```
Dos ases con reposición:  4/52 · 4/52  = 1/169
Dos ases sin reposición:  4/52 · 3/51  = 1/221     ← quedan 3 ases en 51 cartas
```

### La falacia del jugador

Después de cinco caras seguidas, la siguiente sigue teniendo probabilidad 1/2. La
moneda no recuerda nada. Que a la larga salga la mitad de cada no significa que el
azar «compense» lo que ya pasó: significa que cinco caras se diluyen entre miles de
lanzamientos.

## Probabilidades en la sociedad

Esta parte no es un apéndice: es donde la probabilidad cambia decisiones reales, y
donde peor funciona la intuición.

### El cumpleaños compartido

En un curso de 30 personas, ¿qué probabilidad hay de que dos cumplan el mismo día?
Casi todo el mundo dice «poca». Se calcula por el complemento:

```
P(todos distintos) = 365/365 · 364/365 · … · 336/365 ≈ 0,294
P(alguna coincidencia) = 1 − 0,294 ≈ 70,6 %
```

**Siete de cada diez cursos tienen una coincidencia.** Se puede comprobar en clase,
que es la mejor parte.

### Loterías

```
Loto (6 de 41):   1 entre 4 496 388
```

Para hacerlo comparable: si se compra un cartón a la semana, se acierta en promedio
una vez cada **86 000 años**. Ninguna estrategia de números cambia eso, porque todas
las combinaciones son igual de probables — incluida 1-2-3-4-5-6.

### Seguros

Una aseguradora no adivina quién chocará: cobra a muchos un poco más de lo que
espera pagar. Es el **valor esperado** aplicado a gran escala, y funciona
precisamente porque los casos individuales son impredecibles y el promedio no.

### Pruebas médicas: el caso que engaña a casi todos

Una enfermedad afecta al 1 % de la población. Una prueba acierta el 99 % de las
veces. Sale positiva. ¿Qué probabilidad hay de estar enfermo?

La respuesta intuitiva es «99 %». Con 10 000 personas se ve que no:

| | Enfermos (100) | Sanos (9 900) | Total |
|---|---|---|---|
| Positivo | 99 | 99 | 198 |
| Negativo | 1 | 9 801 | 9 802 |

De los 198 positivos, solo 99 están enfermos: **la mitad**.

El motivo es que los sanos son tantos que su 1 % de error produce tantos falsos
positivos como enfermos verdaderos hay. Por eso una prueba positiva se repite con
otra prueba antes de dar un diagnóstico. Es una tabla de contingencia, la misma de
antes, decidiendo algo importante.

### Leer una noticia

- **«Duplica el riesgo»** no dice nada sin el riesgo de partida: pasar de 1 en un
  millón a 2 en un millón también es duplicarlo.
- **Un 90 % de efectividad** solo se entiende sabiendo sobre qué y comparado con
  qué.
- **Una correlación no es una causa**, como ya decía la
  [nube de puntos](/matematicas/nube-de-puntos/).

## Errores frecuentes

- **Multiplicar probabilidades de sucesos dependientes.** Sin reposición, el segundo
  cambia.
- **Sumar sin restar la intersección** y pasarse de 1.
- **Creer que el azar compensa.** La moneda no recuerda.
- **Confundir «poco probable» con «imposible».** Con suficientes intentos, lo
  improbable ocurre: alguien gana la lotería.
- **Olvidar la frecuencia base**, que es el error de la prueba médica y el más caro
  de todos fuera del aula.
