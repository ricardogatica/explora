---
titulo: Cinemática: describir el movimiento
materia: fisica
categoria: Ejes de la física
descripcion: Posición, velocidad y aceleración, con las fórmulas del movimiento uniforme y acelerado.
bandas: [15-17]
orden: 130
---

# Cinemática: describir el movimiento

La cinemática describe **cómo** se mueve algo, sin preguntarse por qué. Con tres
magnitudes se describe cualquier movimiento en línea recta.

| Magnitud | Qué mide | Unidad |
|---|---|---|
| posición (x) | dónde está | metro (m) |
| velocidad (v) | cómo cambia la posición | m/s |
| aceleración (a) | cómo cambia la velocidad | m/s² |

## Rapidez y velocidad no son lo mismo

La **rapidez** es un número; la **velocidad** es un número con dirección. Quien da
una vuelta completa a una pista y vuelve al punto de partida recorrió 400 metros a
buena rapidez, pero su desplazamiento fue cero y su velocidad media también.

Distinguirlas evita la mitad de los errores en los problemas.

## Movimiento con velocidad constante

```
x = x₀ + v · t
```

En un gráfico posición-tiempo sale una recta, y su **pendiente es la velocidad**:
cuanto más inclinada, más rápido. Una recta horizontal es un objeto quieto.

## Movimiento con aceleración constante

Es el caso de la caída libre, donde a = g ≈ 9,8 m/s².

```
v  = v₀ + a · t
x  = x₀ + v₀ · t + ½ · a · t²
v² = v₀² + 2 · a · (x − x₀)
```

La tercera es la que se olvida y la más útil: sirve cuando no se conoce el tiempo
ni hace falta.

**Ejemplo.** Se suelta una piedra desde 45 m. ¿Cuánto tarda?

Con la segunda, tomando x₀ = 0 y v₀ = 0: 45 = ½ · 9,8 · t², de donde t² = 9,18 y
t ≈ 3,0 s. Y su velocidad al llegar: v = 9,8 · 3,0 ≈ 29 m/s, unos 106 km/h.

## Leer los gráficos

| Gráfico | La pendiente es | El área bajo la curva es |
|---|---|---|
| posición-tiempo | la velocidad | — |
| velocidad-tiempo | la aceleración | el desplazamiento |

Saber esto permite resolver muchos problemas sin usar ninguna fórmula.

## Errores frecuentes

- **Confundir velocidad con aceleración.** Un coche a 100 km/h constantes tiene
  velocidad grande y aceleración **cero**.
- **Creer que aceleración negativa es siempre frenar.** Significa que apunta en
  sentido contrario al eje elegido. Un objeto que cae con el eje hacia arriba tiene
  aceleración negativa y va cada vez más rápido.
- **Pensar que en el punto más alto de un lanzamiento la aceleración es cero.** La
  velocidad es cero un instante; la aceleración sigue siendo 9,8 m/s² hacia abajo.
  Si fuera cero, la piedra se quedaría flotando ahí.
- **Usar las fórmulas de aceleración constante cuando no lo es.** Con roce del aire
  importante, no valen.
