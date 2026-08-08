# Explora

Base de conocimiento interactivo para niños y niñas, pensada también para el
adulto que acompaña. Cada materia tiene contenido, preguntas y una progresión por
edades; el módulo del universo es un simulador 3D con 415 fichas de cuerpos,
estrellas y constelaciones.

## Qué hay dentro

| Carpeta | Qué es |
|---|---|
| `contenido/` | El contrato de contenido: bandas de edad, esquema y validador |
| `lenguaje/`, `matematicas/` | Materias actuales (se migran a `materias/` en la fase 2) |
| `sistema_solar/` | Simulador 3D del universo y sus fichas |
| `tests/` | 114 tests, sin dependencias |
| `tools/` | Generadores, como el del catálogo del cielo |
| `docs/superpowers/` | Specs y planes de las reformas en curso |

## Cómo se levanta

No hay build ni dependencias todavía:

```sh
./run.sh 6767      # y abrir http://localhost:6767
```

El servidor manda `Cache-Control: no-store` a propósito: sin eso el navegador
sirve módulos viejos después de editarlos y se depura código que ya no existe.

## Tests

```sh
node --test        # desde la raíz, no desde tests/
```

Cubren el catálogo del cielo, las proyecciones de las constelaciones, la
navegación, el movimiento por tiempo y el contrato de contenido.

## La ruta de aprendizaje

El contenido se etiqueta con bandas de edad que particionan de 5 a 17 años:

`5–6` · `7–8` · `9–10` · `11–12` · `13–14` · `15–17`

Más `previo`, para lo anterior a los 5, que queda fuera de la progresión. La
definición está en `contenido/bandas.js` y hay tests que comprueban que no haya
huecos ni solapes.

## Licencias

- **Código: MIT.** Ver [LICENSE](LICENSE).
- **Contenido: CC BY-SA 4.0.** Ver [LICENSE-CONTENIDO](LICENSE-CONTENIDO).
- **Material de terceros:** el catálogo del cielo es obra derivada de HYG y
  Stellarium (CC BY-SA 4.0) y las texturas de los planetas son de Solar System
  Scope (CC BY 4.0). Todo está citado en `sistema_solar/referencias.html`, que es
  la atribución visible que exigen esas licencias, y detallado en
  [LICENSE-CONTENIDO](LICENSE-CONTENIDO).
