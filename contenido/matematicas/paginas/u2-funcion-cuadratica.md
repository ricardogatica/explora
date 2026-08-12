---
titulo: Función cuadrática
materia: matematicas
categoria: (Segundo medio) Unidad 2 · Álgebra y funciones
descripcion: La ecuación de segundo grado, la parábola y cómo se mueve al cambiar sus números.
bandas: [15-17]
orden: 310
refuerzo: [patrones-algebra, u1-numeros-reales]
---

# Función cuadrática

*Unidad 2 · Lección 1 — Segundo medio*

Una **función cuadrática** es toda función de la forma

```
f(x) = ax² + bx + c        con a ≠ 0
```

El **a ≠ 0** es lo que la hace cuadrática: si a fuera 0 quedaría bx + c, que es una
recta. Su gráfica es siempre una **parábola**.

## Ecuación cuadrática

Resolver ax² + bx + c = 0 es preguntar dónde la parábola corta el eje X.

### Tres formas de resolver, y cuándo usar cada una

**1. Factorizando**, cuando se ve a simple vista:

```
x² − 5x + 6 = 0   →   (x − 2)(x − 3) = 0   →   x = 2  o  x = 3
```

Funciona porque un producto es cero solo si uno de los factores lo es.

**2. Despejando**, cuando falta el término en x:

```
2x² − 18 = 0   →   x² = 9   →   x = ±3
```

El **±** no se olvida: hay dos números cuyo cuadrado es 9.

**3. Con la fórmula**, que sirve siempre:

```
        −b ± √(b² − 4ac)
   x = ──────────────────
              2a
```

### El discriminante decide cuántas soluciones hay

Lo que va dentro de la raíz tiene nombre propio: **Δ = b² − 4ac**.

| Δ | Soluciones reales | La parábola… |
|---|---|---|
| Δ > 0 | dos distintas | corta el eje X en dos puntos |
| Δ = 0 | una (doble) | toca el eje X en un punto |
| Δ < 0 | ninguna | no toca el eje X |

Que Δ < 0 no tenga solución **real** es coherente con la unidad anterior: sería la
raíz cuadrada de un negativo, y en ℝ no existe.

**Ejemplo.** 2x² − 7x + 3 = 0 → Δ = 49 − 24 = 25 > 0.

```
     7 ± √25     7 ± 5
x = ───────── = ───────   →   x = 3   o   x = 1/2
        4          4
```

Se comprueba sustituyendo, que cuesta diez segundos: 2(9) − 21 + 3 = 0 ✓.

## Función cuadrática y su gráfica

| Elemento | Cómo se calcula | Qué es |
|---|---|---|
| concavidad | signo de a | a > 0 abre hacia arriba; a < 0, hacia abajo |
| eje de simetría | x = −b / 2a | la recta vertical que la parte por la mitad |
| vértice | x = −b/2a, y = f(−b/2a) | el punto más bajo (a>0) o más alto (a<0) |
| corte con el eje Y | f(0) = c | el término independiente, directo |
| cortes con el eje X | soluciones de f(x) = 0 | ninguno, uno o dos |

El eje de simetría pasa **exactamente por el medio de las dos raíces**, y eso da un
atajo: si las raíces son 1/2 y 3, el vértice está en x = (0,5 + 3)/2 = 1,75.

**Ejemplo completo.** f(x) = x² − 4x + 3.

```
a = 1 > 0            →  abre hacia arriba
eje:  x = 4/2 = 2
vértice: f(2) = 4 − 8 + 3 = −1   →   V(2, −1)
corte Y: c = 3                    →   (0, 3)
cortes X: x² − 4x + 3 = 0 → (x−1)(x−3) = 0 → (1,0) y (3,0)
```

Con esos cinco datos la parábola se dibuja sin hacer una tabla de valores.

## Desplazamientos de la gráfica

Escrita de otra manera, la función dice dónde está su vértice sin ninguna cuenta.
Es la **forma canónica**:

```
f(x) = a(x − h)² + k        con vértice en (h, k)
```

| Cambio | Qué le pasa a la parábola |
|---|---|
| k aumenta | sube k unidades |
| k disminuye | baja |
| h aumenta | se mueve a la **derecha** h unidades |
| h disminuye | se mueve a la izquierda |
| \|a\| crece | se estrecha (más cerrada) |
| \|a\| se acerca a 0 | se ensancha |
| a cambia de signo | se da la vuelta |

El desplazamiento horizontal es el que engaña: en (x − 3)² la parábola se va a la
**derecha**, aunque el signo sea menos. Tiene sentido si se piensa en qué valor de x
anula el paréntesis: con x = 3 vale cero, y ahí está el vértice.

### Pasar de una forma a la otra

De canónica a general basta desarrollar. Al revés se completa el cuadrado:

```
f(x) = x² − 4x + 3
     = (x² − 4x + 4) − 4 + 3        se suma y se resta (4/2)² = 4
     = (x − 2)² − 1                  →   vértice (2, −1)
```

Y coincide con lo calculado antes con la fórmula del eje, que es una buena forma de
comprobarlo.

## Dónde aparece

- **Lanzar algo.** Sin resistencia del aire, la altura en función del tiempo es una
  cuadrática, y el vértice es la altura máxima.
- **Área máxima con un perímetro dado.** Con 40 m de reja, el rectángulo de mayor
  área es el cuadrado de 10 × 10, y eso se demuestra buscando el vértice.
- **Costo e ingreso** en economía, cuando subir el precio baja las ventas.
- **Antenas y faros**: la parábola concentra en un punto todo lo que le llega
  paralelo. De ahí su forma.

## Errores frecuentes

- **Perder una solución al despejar.** x² = 9 tiene dos soluciones, no una.
- **Equivocar el signo del desplazamiento.** (x − 3)² va a la derecha.
- **Calcular Δ sin cuidado con los signos.** Con b negativo, b² es positivo; con
  a o c negativos, −4ac cambia de signo.
- **Creer que Δ < 0 es un error de cuentas.** Es una respuesta: esa parábola no
  corta el eje X.
- **Usar la fórmula sin ordenar antes la ecuación.** Tiene que estar igualada a
  cero: en x² = 5x − 6 primero se pasa todo a un lado.
