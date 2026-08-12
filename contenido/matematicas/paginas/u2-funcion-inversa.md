---
titulo: Función inversa
materia: matematicas
categoria: Unidad 2 · Álgebra y funciones
descripcion: Deshacer una función, cuándo se puede, y las inversas de la lineal, la afín y la cuadrática.
bandas: [15-17]
orden: 320
refuerzo: [u2-funcion-cuadratica, patrones-algebra]
---

# Función inversa

*Unidad 2 · Lección 2 — Segundo medio*

## Concepto

Una función toma un número y devuelve otro. Su **inversa** deshace el camino:

```
f(x) = x + 5        f(3) = 8
f⁻¹(x) = x − 5      f⁻¹(8) = 3        vuelve al 3
```

Formalmente, f⁻¹ es la función que cumple

```
f⁻¹(f(x)) = x        y        f(f⁻¹(x)) = x
```

Es la misma idea de la unidad anterior: la raíz deshace la potencia y el logaritmo
deshace la exponencial. Aquí se generaliza.

**Cuidado con la notación:** f⁻¹ **no** es 1/f. El −1 no es un exponente aquí, y es
una de las notaciones peor elegidas de las matemáticas escolares.

## Condiciones para que una función tenga inversa

No todas la tienen, y el motivo es sencillo: para poder volver, cada resultado tiene
que venir de un solo sitio.

```
f(x) = x²        f(3) = 9        f(−3) = 9
```

Al ver un 9 no hay forma de saber si veníamos del 3 o del −3. Esa función no se
puede deshacer.

Una función es **inyectiva** cuando valores distintos dan resultados distintos, y
solo las inyectivas tienen inversa.

### Cómo se comprueba en la gráfica

**La prueba de la recta horizontal.** Si alguna recta horizontal corta la gráfica en
más de un punto, hay dos entradas con la misma salida y no hay inversa.

| Función | ¿Corta alguna horizontal dos veces? | ¿Tiene inversa? |
|---|---|---|
| f(x) = 2x + 1 | no | sí |
| f(x) = x² | sí (todas las de arriba) | no, salvo restringiendo |
| f(x) = x³ | no | sí |
| f(x) = \|x\| | sí | no |

### Restringir el dominio

Cuando no la tiene, se puede **recortar** la función hasta que la tenga. Es lo que
se hace con la raíz cuadrada:

```
f(x) = x²   con x ≥ 0   →   f⁻¹(x) = √x
```

Por eso √9 = 3 y no ±3: la función raíz devuelve solo el valor positivo, porque se
definió sobre la mitad derecha de la parábola. No es una convención arbitraria; es
lo que hace falta para que sea función.

## Cómo se obtiene

Tres pasos mecánicos:

```
1. Escribir  y = f(x)
2. Despejar  x  en función de  y
3. Intercambiar los nombres: lo despejado es f⁻¹(x)
```

**Ejemplo.** f(x) = 3x − 6

```
y = 3x − 6
y + 6 = 3x
x = (y + 6)/3
f⁻¹(x) = (x + 6)/3
```

Y se comprueba, que es el paso que casi nadie hace y el que descubre los errores:

```
f(4) = 6          f⁻¹(6) = 12/3 = 4  ✓
```

## Inversas de las funciones que ya conoces

### Lineal: f(x) = ax

```
f⁻¹(x) = x/a          (con a ≠ 0)
```

Duplicar se deshace dividiendo entre dos.

### Afín: f(x) = ax + b

```
f⁻¹(x) = (x − b)/a
```

Se deshace en orden inverso: primero se quita lo que se sumó, después se deshace la
multiplicación. Como al desvestirse.

### Cuadrática: f(x) = ax² + bx + c

Solo con el dominio restringido a un lado del vértice. Con la forma canónica sale
directo:

```
f(x) = (x − 2)² − 1     con x ≥ 2

y + 1 = (x − 2)²
√(y + 1) = x − 2          (solo la raíz positiva, porque x ≥ 2)
f⁻¹(x) = √(x + 1) + 2
```

Comprobación: f(5) = 9 − 1 = 8, y f⁻¹(8) = √9 + 2 = 5 ✓.

## La simetría que lo explica todo

Las gráficas de f y f⁻¹ son **simétricas respecto de la recta y = x**. Tiene que ser
así: si el punto (a, b) está en f, entonces (b, a) está en f⁻¹, y reflejar en y = x
es exactamente intercambiar las coordenadas.

De ahí sale una comprobación rápida: si la inversa calculada no queda reflejada,
está mal.

También explica dos cosas conocidas:

- La gráfica de y = √x es media parábola tumbada.
- La de y = log x es la de y = 10ˣ reflejada.

## Errores frecuentes

- **Creer que f⁻¹ = 1/f.** La inversa de f(x) = x + 2 es x − 2, no 1/(x+2).
- **Dar inversa a una función que no la tiene** sin decir sobre qué dominio.
- **Deshacer en el orden equivocado.** En 3x + 6 primero se resta 6 y después se
  divide entre 3; al revés da otra cosa.
- **Olvidar el ± al invertir una cuadrática**, o ponerlo cuando el dominio ya
  eligió un lado.
- **No comprobar.** Con un solo número se detecta casi cualquier error, y cuesta
  diez segundos.
