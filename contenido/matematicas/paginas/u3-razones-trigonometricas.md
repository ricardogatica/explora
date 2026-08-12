---
titulo: Razones trigonométricas
materia: matematicas
categoria: Unidad 3 · Geometría
descripcion: Seno, coseno y tangente en el triángulo rectángulo, sus valores y de dónde salen.
bandas: [15-17]
orden: 410
refuerzo: [geometria-medicion, u1-numeros-reales]
---

# Razones trigonométricas

*Unidad 3 · Lección 1 — Segundo medio*

En un triángulo rectángulo, los lados tienen nombre según el ángulo que se mire:

```
        │\
        │ \
 cateto │  \  hipotenusa        La hipotenusa es siempre el lado
 opuesto│   \                   opuesto al ángulo recto: el más largo.
        │  α \
        └─────
      cateto adyacente
```

Las tres razones son cocientes entre esos lados:

```
sen α = opuesto / hipotenusa
cos α = adyacente / hipotenusa
tan α = opuesto / adyacente        (y también sen α / cos α)
```

## La idea que lo sostiene todo

**Dos triángulos rectángulos con el mismo ángulo son semejantes**, así que sus lados
están en la misma proporción por grandes o pequeños que sean. Por eso el seno de 30°
vale lo mismo en un triángulo de 3 cm y en uno de 3 km.

Eso es lo que convierte la trigonometría en una herramienta de medir: una razón que
solo depende del ángulo permite calcular un lado que no se puede alcanzar.

Como el opuesto y el adyacente son siempre menores que la hipotenusa, se deduce sin
memorizar nada:

```
0 ≤ sen α ≤ 1        0 ≤ cos α ≤ 1        (para 0° ≤ α ≤ 90°)
```

Un seno de 1,3 es un error de cuentas, siempre.

## Razones trigonométricas en nuestro entorno

Sirven cuando hay que medir algo a lo que no se llega:

- **La altura de un edificio** desde la vereda, con el ángulo hasta lo alto y la
  distancia a la base.
- **La pendiente de un camino.** Un 12 % de pendiente significa tan α = 0,12, o sea
  unos 6,8°.
- **Una rampa accesible** no puede pasar del 8 %: la norma se escribe en tangentes.
- **La inclinación de un techo** para que el agua corra.
- **La altura del Sol** sobre el horizonte, que decide dónde cae la sombra de un
  alero: por eso los aleros del norte y del sur se diseñan distinto.
- **La distancia a una estrella cercana** por paralaje: la trigonometría es la
  primera regla que midió el cielo.

## Valores de las razones trigonométricas

### Los tres ángulos que conviene saber de memoria

No hace falta memorizarlos: salen de dos triángulos.

**El de 45°** es medio cuadrado de lado 1. Su hipotenusa mide √2.

```
sen 45° = 1/√2 = √2/2 ≈ 0,707
cos 45° = √2/2
tan 45° = 1                    (los dos catetos son iguales)
```

**Los de 30° y 60°** salen de medio triángulo equilátero de lado 2: la base queda
en 1 y la altura, por Pitágoras, en √3.

```
sen 30° = 1/2 = 0,5            cos 30° = √3/2 ≈ 0,866
sen 60° = √3/2                 cos 60° = 1/2
tan 30° = 1/√3 ≈ 0,577         tan 60° = √3 ≈ 1,732
```

| α | sen | cos | tan |
|---|---|---|---|
| 0° | 0 | 1 | 0 |
| 30° | 1/2 | √3/2 | √3/3 |
| 45° | √2/2 | √2/2 | 1 |
| 60° | √3/2 | 1/2 | √3 |
| 90° | 1 | 0 | no existe |

**tan 90° no existe** porque el cateto adyacente sería cero, y no se divide por
cero. No es un hueco de la tabla: es la misma regla de la Unidad 1.

Se nota además que **el seno crece y el coseno decrece**, y que sen α = cos(90° − α):
el opuesto de un ángulo agudo es el adyacente del otro.

### La relación fundamental

```
sen²α + cos²α = 1
```

No es una fórmula que aparezca de la nada: es el teorema de Pitágoras dividido por
la hipotenusa al cuadrado. Si o² + a² = h², al dividir todo por h² queda
(o/h)² + (a/h)² = 1.

Sirve para obtener una razón desde la otra. Si sen α = 0,6:

```
cos²α = 1 − 0,36 = 0,64   →   cos α = 0,8   (positivo, es un ángulo agudo)
tan α = 0,6 / 0,8 = 0,75
```

### Con la calculadora

Dos cuidados que arruinan más ejercicios que ninguna otra cosa:

1. **La calculadora tiene que estar en DEG** (grados), no en RAD. Si sen 30° no da
   0,5, está en radianes.
2. **Para obtener el ángulo** desde la razón se usa la tecla inversa: sen⁻¹, cos⁻¹,
   tan⁻¹. Es la función inversa de la unidad anterior, y necesita el dominio
   restringido por el mismo motivo.

## Errores frecuentes

- **Confundir opuesto y adyacente.** Dependen del ángulo que se mire, no del dibujo:
  el mismo lado es opuesto para un ángulo y adyacente para el otro.
- **Llamar hipotenusa al lado de abajo.** Es siempre el opuesto al ángulo recto.
- **Dar un seno mayor que 1.** Imposible: el opuesto nunca supera a la hipotenusa.
- **Tener la calculadora en radianes.**
- **Usar estas razones en un triángulo que no es rectángulo.** Ahí hacen falta los
  teoremas del seno y del coseno, que vienen después.
