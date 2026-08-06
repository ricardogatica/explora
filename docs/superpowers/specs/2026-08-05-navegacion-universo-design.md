# Navegación del universo para el visitante

**Fecha:** 2026-08-05
**Rama:** `feature/navegacion-universo`
**Estado:** diseño aprobado, pendiente de plan de implementación

## Contexto

El módulo `sistema_solar/` contiene 25 páginas HTML y 207 entidades navegables,
pero un visitante no puede recorrerlas. Solo `sistema_solar/index.html` tiene
enlace de vuelta a la portada; las otras 24 páginas no. No existe índice de
contenidos. Desde la ficha de Marte no hay forma de llegar a la de Júpiter sin
retroceder a la escena 3D y buscar el planeta a mano.

### Corrección de una premisa inicial

La petición original hablaba de «cambiar a Three.js el modelo del universo».
El módulo **ya está construido con Three.js** (0.185.0, cargado por importmap
desde unpkg en cada página; `main.js`, `body.js`, `body-renderer.js`,
`star-renderer.js` y `galaxy-renderer.js` son código Three.js). No hay
migración que hacer.

Al medir el código aparecieron dos problemas distintos, ninguno de los cuales
es este spec, y ambos quedan registrados en «Fuera de alcance»:

1. **El modelo es decorativo, no físico.** Los radios y órbitas son unidades
   arbitrarias: la razón Sol/Tierra es 3,3× cuando la real es 109×; 1 UA vale
   18 radios terrestres cuando son 23.481. Los períodos no cumplen la tercera
   ley de Kepler (Neptuno/Tierra da 5,4× en vez de 164,8×). Las órbitas son
   círculos perfectos sin excentricidad (`solar-system.js:41-47`) y la
   «inclinación» es un array a mano indexado por orden de planeta. La gravedad
   no se simula: `"9,81 m/s²"` es un string que se imprime en el panel
   (`main.js:98`).
2. **`main.js` no es navegable para quien programa.** 118 líneas, varias de más
   de 2.000 caracteres, con escena, luces, Big Bang, quásares, planetas,
   efectos temporales, línea temporal, panel de información, raycasting y
   cámara en un solo archivo.

El usuario decidió explícitamente no abordar la física. La modularización se
difiere al ciclo visual, donde es inevitable porque texturas y shaders viven
en esos mismos archivos.

### Inventario real

| Grupo | Cantidad | Cómo se sirve |
|---|---|---|
| Cuerpos del sistema solar | 10 | `.html` propio (cargan `body.js`) |
| Estrellas | 108 | 9 con `.html` propio; 99 vía `star.html?slug=` |
| Constelaciones | 88 | 4 detalladas + 84 generadas del catálogo IAU |
| Galaxias | 1 | `milky-way.html` |
| **Total** | **207** | 25 archivos HTML |

Dos hallazgos condicionan el diseño:

- Las constelaciones **no tienen ficha individual** (`main.js:98` hace
  `openFile.style.display="none"`) y `constellations-view.js:84` las enfoca con
  `focusEntry` en memoria, sin leer `?slug=`. Hoy es imposible enlazar a una
  constelación concreta desde fuera.
- Las estrellas sí aceptan deep-link: `universe-body.js:7` ya lee `?slug=`.

## Decisiones tomadas

| Decisión | Elección |
|---|---|
| Descomposición | Tres ciclos secuenciales: **navegación** → visual → contenido |
| Significado de «navegable» | Para quien **visita**, no para quien programa |
| Patrón | Índice + migas de pan + salto entre hermanos |
| Alcance del índice | Las 207 entradas, con constelaciones deep-linkeables |
| Aterrizaje | La portada sigue llevando al 3D; el índice se alcanza desde el HUD |
| Filtro en el índice | Sí, texto client-side, sin dependencias |

## Alcance

**Entra:**

- Página nueva `sistema_solar/indice.html` con las 207 entradas agrupadas y filtrables.
- Migas de pan y salto entre hermanos en las 21 fichas (10 de cuerpos + 11 que
  cargan `universe-body.js`, una de ellas la plantilla `star.html` que sirve 99
  estrellas).
- Ruta a la portada desde las 26 páginas: las 25 existentes más `indice.html`.
- Soporte de `?slug=` en `constellations-view.js`.

**Fuera de alcance** (cada uno con su propio ciclo de spec → plan → implementación):

- Unidades reales y mecánica orbital (Kepler, excentricidad, gravedad calculada).
- Texturas reales, shaders, modelos glTF, iluminación física.
- Contenido educativo nuevo (más cuerpos, comparaciones, ejercicios).
- Modularizar `main.js` — se difiere al ciclo visual.
- Reorganizar carpetas y unificar convenciones con `lenguaje/` y `matematicas/`.
- Cualquier cambio en `lenguaje/` o `matematicas/`, salvo mover el CSS
  duplicado de `.atlas-back` a una hoja compartida.

## Arquitectura

### Un módulo `nav.js` compartido

Alternativas consideradas:

| Enfoque | Coste | Problema |
|---|---|---|
| **A. Módulo JS compartido** ← elegido | 1 archivo + 1 línea por página | La nav aparece tras cargar el JS |
| B. HTML estático en cada ficha | 25 copias a mano | Imposible para las 99 estrellas que comparten `star.html` |
| C. Generador que reescribe los HTML | Script + paso de build | Introduce build en un proyecto cero-build |

B queda descartado por un hecho, no por preferencia: 99 de las 108 estrellas se
sirven desde una única plantilla parametrizada por `?slug=`, así que su
navegación no puede ser estática. Sobre la pega de A: estas páginas ya dependen
al 100% de JavaScript — `body.js:11` inyecta incluso la tabla de datos —, de
modo que no se pierde robustez que hoy exista.

**Responsabilidad de `nav.js`:** dado el contexto de la página, producir migas y
hermanos e inyectarlos en el `.side-card` existente.

**Interfaz:** módulo ES sin exports; se ejecuta al cargar. Deduce el contexto en
este orden: `data-slug` → `data-universe-slug` → `?slug=` → nombre de archivo.

**Depende de:** `data.js` (que ya reexporta `BODY_DATA`, `BODY_ORDER`,
`KNOWN_STARS`, `CONSTELLATIONS`, `KNOWN_GALAXIES`) y de las clases `.btn`,
`.eyebrow` y `.side-card` de `styles.css`. No depende de Three.js ni de la escena.

### El índice

`indice.html` importa los mismos módulos de datos que la escena, de forma que no
puede desincronizarse del contenido.

| Grupo | Orden | Destino |
|---|---|---|
| Sistema solar (10) | `BODY_ORDER` (9) con la Luna tras la Tierra | `earth.html` |
| Estrellas (108) | `distanceLy` ascendente | `sirius.html` o `star.html?slug=` |
| Constelaciones (88) | Alfabético, con hemisferio | `constellations.html?slug=` |
| Galaxias (1) | — | `milky-way.html` |

`BODY_ORDER` contiene **9** cuerpos: la Luna no está en él porque es satélite,
no planeta. El índice la lista igualmente, insertada tras la Tierra, para que
las 10 fichas de cuerpos sean alcanzables.

Las estrellas se ordenan por distancia y no alfabéticamente porque el recorrido
«de Próxima Centauri hacia fuera» enseña algo; el alfabético no.

Filtro de texto client-side sobre nombre, tipo y constelación.

Las 183 entradas generadas (99 estrellas + 84 constelaciones) llevan una marca
discreta «datos aproximados». Sus propias descripciones ya lo admiten
(`stars.js:49`, `makeGeneratedConstellation` en `constellations.js`), y el
índice las expone todas juntas, así que conviene decirlo de frente.

### Migas y hermanos

```
Explora › Universo › Índice › Tierra
‹ Venus                        Marte ›
```

Enlazan a `../index.html`, `./index.html` e `./indice.html`.

Los hermanos usan el mismo orden que el índice y **no dan la vuelta**: el Sol
muestra solo «Mercurio ›» y Neptuno solo «‹ Urano». Saltar de Neptuno al Sol
confundiría más de lo que ayuda.

La cadena de cuerpos son los **9 de `BODY_ORDER`**: la Tierra enlaza a Venus y
Marte, no a la Luna. La Luna no tiene hermanos; llega a la Tierra por el
`parentLink` que `body.js:9` ya rellena desde `moon.parent`. Las lunas de
Júpiter (`bodies/jupiter.js`) no entran: no tienen ficha propia, solo se
renderizan dentro de `jupiter.html`.

Las 4 páginas que no son fichas (`index`, `constellations`, `solar-scale`,
`referencias`) reciben migas sin hermanos. `constellations.html` conserva su
lista interna de 88 botones como forma de moverse entre constelaciones; no se
le añade salto entre hermanos.

### Cambios en archivos existentes

- **`constellations-view.js`**: leer `?slug=` al cargar y enfocar esa
  constelación; `history.replaceState` al pulsar otra. Es lo que hace
  enlazables las 88.
- **`universe-body.js:11`**: hoy un slug inválido lanza `Error` y deja la página
  en blanco. El índice convierte esas URLs en enlaces de primera clase, así que
  necesita un mensaje legible con enlace al índice.
- **`.atlas-back`**: su CSS está duplicado en línea en
  `sistema_solar/index.html:9-11` y `lenguaje/index.html:10-12`. Se unifica al
  añadir las migas.

## Verificación

El repositorio no tiene tests. Se entrega un script de comprobación que valida:

1. Cada una de las 207 entradas del índice resuelve a un destino real: archivo
   existente, o slug presente en los datos para las URLs con `?slug=`.
2. Las 26 páginas (25 existentes + `indice.html`) tienen enlace directo a la
   portada: un clic, no una cadena de vueltas atrás.
3. Los hermanos son simétricos: si el siguiente de Venus es Marte, el anterior
   de Marte es Venus. Los extremos (Sol, Neptuno) tienen un solo vecino.
4. Ningún enlace local roto en los 26 HTML.
5. `data.js` sigue importándose sin Three.js, que es lo que permite al índice
   compartir los datos de la escena sin cargar el motor 3D (verificado durante
   el diseño: 13 exports, 108 estrellas, 88 constelaciones).

Comprobación manual: la escena 3D debe verse idéntica — `nav.js` solo toca DOM
fuera del canvas. Y el `.side-card` a 360px de ancho, con las migas añadidas.

## Riesgos

- **El índice hace visible la calidad desigual del contenido.** 183 de 207
  entradas son generadas con datos aproximados y descripciones automáticas. La
  marca lo mitiga; resolverlo de verdad es el ciclo 3.
- **`.side-card` en móvil.** Ya es `max-height:calc(100vh - 36px)` con scroll
  interno; las migas suman unos 28px. Verificable a 360px.

## Supuestos

- Se conservan los datos educativos existentes (gravedad, distancias, períodos)
  tal como están, incluidas sus imprecisiones. Corregirlos es otro ciclo.
- Se mantiene el proyecto sin build: HTML, CSS y módulos ES servidos tal cual,
  con Three.js por importmap desde CDN.
- Las URLs actuales no cambian: `sistema_solar/index.html` sigue siendo la
  escena 3D.
