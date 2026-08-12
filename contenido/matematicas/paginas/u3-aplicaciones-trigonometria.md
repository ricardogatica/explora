---
titulo: Aplicaciones de las razones trigonométricas
materia: matematicas
categoria: (Segundo medio) Unidad 3 · Geometría
descripcion: Ángulos de elevación y depresión, descomposición de vectores y cómo atacar un problema.
bandas: [15-17]
orden: 420
refuerzo: [u3-razones-trigonometricas, geometria-medicion]
---

# Aplicaciones de las razones trigonométricas

*Unidad 3 · Lección 2 — Segundo medio*

## Ángulos de elevación y depresión

Los dos se miden **desde la horizontal**, y esa es la única definición que hay que
retener:

- **Elevación:** hacia arriba. Mirar la punta de un edificio desde el suelo.
- **Depresión:** hacia abajo. Mirar un barco desde lo alto de un acantilado.

```
                    ● punta
                   /│
                  / │
       elevación /  │  altura
              α /   │
    ───────────┴────┘
        distancia
```

**Ejemplo.** Desde 25 m de la base de un edificio, la punta se ve con 62° de
elevación. Los ojos están a 1,6 m del suelo.

```
tan 62° = h / 25        →   h = 25 · tan 62° = 25 · 1,881 = 47,0 m
altura total = 47,0 + 1,6 = 48,6 m
```

**Los 1,6 m son la mitad del ejercicio.** El triángulo empieza en los ojos, no en el
suelo, y olvidarlo es el error más común de esta lección.

Un detalle que ahorra confusión: **el ángulo de depresión desde arriba es igual al
de elevación desde abajo**, porque son ángulos alternos internos entre dos
horizontales paralelas.

## Descomposición vectorial

Un vector —una fuerza, una velocidad— que apunta en diagonal se puede cambiar por
dos que apunten en horizontal y vertical y hagan exactamente lo mismo:

```
vₓ = v · cos α          (componente horizontal)
v_y = v · sen α         (componente vertical)
```

Y al revés, desde las componentes:

```
v = √(vₓ² + v_y²)        α = tan⁻¹(v_y / vₓ)
```

**Ejemplo.** Se tira de un carro con 200 N formando 30° con el suelo.

```
horizontal:  200 · cos 30° = 200 · 0,866 = 173,2 N   →  es lo que lo mueve
vertical:    200 · sen 30° = 200 · 0,5   = 100 N     →  lo levanta un poco
```

De aquí sale algo que se puede comprobar en el patio: **tirar horizontalmente empuja
más**. Con 30° se pierde un 13 % de fuerza útil; con 60°, la mitad.

Un plano inclinado se resuelve igual, girando los ejes: el peso se descompone en una
parte que empuja hacia abajo por la rampa (P·sen α) y otra que aprieta contra ella
(P·cos α). Por eso una rampa más empinada cuesta más.

Esto conecta con la física: es lo mismo que se hace en las
[leyes de Newton](/fisica/leyes-de-newton/) para sumar fuerzas.

## Resolución de problemas

Casi todos estos ejercicios se resuelven con el mismo procedimiento, y seguirlo
ahorra la mayoría de los errores.

**1. Dibujar.** Siempre. Un esquema a mano alzada con lo que se sabe y una letra en
lo que se busca.

**2. Marcar el ángulo y nombrar los lados respecto de él.** Opuesto y adyacente
dependen del ángulo elegido, así que se decide primero.

**3. Elegir la razón por lo que se tiene y lo que se busca.**

| Tengo y busco | Uso |
|---|---|
| opuesto y adyacente | tangente |
| opuesto e hipotenusa | seno |
| adyacente e hipotenusa | coseno |
| dos lados, busco el ángulo | la inversa: sen⁻¹, cos⁻¹, tan⁻¹ |

**4. Resolver y comprobar que el resultado es razonable.** Un edificio de 480 m en
un ejercicio de barrio es una coma mal puesta. La hipotenusa tiene que salir mayor
que los catetos, siempre.

### Dos problemas resueltos

**Un cable tenso.** Un poste de 8 m se sujeta con un cable anclado a 6 m de su base.
¿Cuánto mide el cable y qué ángulo forma con el suelo?

```
cable = √(8² + 6²) = √100 = 10 m
tan α = 8/6 = 1,333   →   α = tan⁻¹(1,333) = 53,1°
```

Comprobación: 10 > 8 y 10 > 6 ✓. La hipotenusa es la mayor.

**Dos ángulos, una altura.** Desde un punto, la cima se ve a 30°. Avanzando 50 m
hacia ella, se ve a 45°. ¿Cuánto mide?

Con dos triángulos que comparten la altura h, y llamando x a la distancia desde el
punto más cercano:

```
tan 45° = h / x         →   x = h            (porque tan 45° = 1)
tan 30° = h / (x + 50)  →   h = (h + 50) · 0,5774

h = 0,5774h + 28,87   →   0,4226h = 28,87   →   h ≈ 68,3 m
```

Este es el método que se usó para medir montañas antes de poder subirlas.

## Errores frecuentes

- **Olvidar la altura del observador.** El triángulo empieza en los ojos.
- **Medir el ángulo desde la vertical.** Elevación y depresión se miden desde la
  horizontal.
- **Cambiar seno por coseno en la descomposición.** La componente horizontal lleva
  coseno cuando el ángulo se mide desde la horizontal; si se mide desde la vertical,
  se intercambian. Por eso hay que marcar el ángulo en el dibujo.
- **No comprobar el orden de magnitud.** Un resultado absurdo es un aviso, no un
  resultado.
- **Redondear a mitad del problema** y arrastrar el error al segundo paso.
