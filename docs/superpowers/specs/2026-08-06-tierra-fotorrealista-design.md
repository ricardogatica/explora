# Tierra fotorrealista y pipeline de color

**Fecha:** 2026-08-06
**Rama:** `feature/tierra-fotorrealista`
**Estado:** diseño aprobado, pendiente de plan de implementación
**Ciclo:** 2 de 3 (navegación → **visual** → contenido)

## Contexto

El ciclo 1 dejó el módulo `sistema_solar/` navegable. Este ciclo aborda cómo se
ve. El punto de partida es un prototipo que el usuario trajo,
`sistema_solar/tierra_threejs_ultra.html`, con una Tierra muy por encima de lo
que muestra el sitio.

### Qué hace realmente que el prototipo se vea real

No es el código: son las texturas. El archivo pesa **8,2 MB** porque lleva cinco
mapas equirectangulares de 2048×1024 incrustados como data URI en base64.

| Mapa | Formato | Decodificado | Función |
|---|---|---|---|
| `day` | JPEG | 696K | Color de continentes y océanos |
| `clouds` | PNG | 4324K | Nubes |
| `lights` | PNG | 717K | Luces de ciudad en la cara nocturna |
| `normal` | JPEG | 328K | Relieve sin geometría |
| `specular` | JPEG | 218K | Brillo del agua, no de la tierra |

Encima hay cuatro técnicas de código que sí aportan: gestión de color
(`ACESFilmicToneMapping` + `outputColorSpace` sRGB + exposición 1.15), filtrado
anisotrópico ×16, un pase de *bloom* con `EffectComposer`, y cuatro shaders
propios — terminador día/noche con luces, sombra de las nubes sobre el suelo, y
dos capas de atmósfera.

Lo que hay hoy en `body-renderer.js`, en cambio, son texturas de 1024×512
**dibujadas con `ctx.arc()` y arrays de polígonos escritos a mano**, sobre un
`MeshStandardMaterial` plano.

### El problema de empaquetado

En base64 dentro del HTML, el navegador no puede cachear las texturas, las
reparsea como texto en cada carga, y no se pueden compartir entre páginas.

Medido extrayéndolas y recomprimiéndolas:

| Mapa | Antes | Después | Ahorro |
|---|---|---|---|
| day | 696K | 696K | — |
| **clouds** | **4324K** | **415K** | **91%** |
| lights | 717K | 286K | 61% |
| normal | 328K | 328K | — |
| specular | 218K | 218K | — |
| **Total** | **6286K** | **1945K** | **70%** |

Frente a los 8402K que ocupa hoy el base64: **una reducción del 77%**.

> **Corregido durante la implementación.** Esta tabla daba el mapa de nubes en
> 415K y el total en 1945K. Era falso, y el error merece quedar escrito porque
> ilustra un fallo de método: verifiqué cómo el shader **lee** la textura
> (`alphaMap` en Three.js toma el canal verde, no el alfa) y di por hecho que el
> alfa no se usaba. Nunca comprobé qué **contenía** el PNG. Al medirlo: el verde
> es casi plano y muy claro (media 204/255), mientras la cobertura real vive en
> el alfa (media 67/255, rango 7–245). Convertir a JPEG tiraba el alfa y dejaba
> una máscara casi opaca que tapaba el planeta con una bola blanca.
>
> La solución es hornear el alfa en el RGB antes de comprimir. El mapa de nubes
> queda en **904K** y el total en **2508K**, todavía un **70% menos** que los
> 8402K del base64. Verificar la interfaz no basta: hay que verificar los datos.

### Procedencia de las texturas

Los metadatos incrustados dicen que **no son un conjunto coherente**:

| Mapa | Herramienta | Fecha |
|---|---|---|
| day | Adobe Photoshop CS6 (Windows) | 2014-10-03 |
| normal | GIMP 2.6.7 | 2010-06-08 |
| lights | Adobe ImageReady | — |
| clouds | perfil ICC de Photoshop | — |

Herramientas distintas y cuatro años de diferencia: están ensambladas de varias
fuentes. No hay un autor único al que atribuir y no se puede determinar la
licencia desde el archivo.

El usuario aceptó añadir atribución. Como el origen es desconocido, la
implementación deja preparada la sección de atribución en `referencias.html`
pero **su contenido lo aporta el usuario**. Si no logra identificar el origen, la
alternativa limpia es sustituir los cinco mapas por un conjunto de licencia
conocida — Solar System Scope publica exactamente estos cinco en 2048×1024 bajo
CC BY 4.0. La sustitución no requiere cambios de código: mismos nombres, mismas
dimensiones.

## Decisiones tomadas

| Decisión | Elección |
|---|---|
| Alcance | Solo la Tierra, bien hecha. Los demás cuerpos siguen procedurales |
| Línea temporal | Fotorreal **solo en la ficha**; la escena principal queda intacta |
| Pipeline de color | A las **10 fichas** de cuerpos; bloom solo para Sol y Tierra |
| Atribución | Sección preparada; contenido pendiente del usuario |

La decisión sobre la línea temporal es la que protege lo educativo. La escena
principal no muestra una Tierra sino **ocho**, conmutadas por la línea temporal
(`body-renderer.js` genera molten, archaean, proterozoic, paleozoic, pangaea,
breakup1, breakup2 y modern; `main.js:97` elige según el evento). Una textura
fotográfica solo representa la Tierra de hoy: no hay foto de Pangea. Cada vista
hace lo que sabe hacer — la ficha enseña cómo es la Tierra, la escena enseña
cómo llegó a serlo.

## Alcance

**Entra:**

- Extraer los cinco mapas a `sistema_solar/textures/earth/` y recomprimirlos.
- Convertir el prototipo en consumidor de esos archivos (8,2 MB → ~30 KB).
- Campo `textures` en `bodies/earth.js`; `body-renderer.js` lo consume de forma
  genérica.
- Material fotorrealista de la Tierra en `earth.html`: día/noche con luces,
  nubes con su sombra, normales, especular y atmósfera.
- Pipeline de color en las 10 fichas de cuerpos; bloom en Sol y Tierra.
- Carga progresiva con la procedural como estado inicial y como reserva.
- Sección de atribución en `referencias.html`.

**Fuera de alcance:**

- Texturas de los otros nueve cuerpos. La maquinaria queda lista para ellas.
- Cualquier cambio en `index.html` y su línea temporal.
- Modularizar `main.js`.
- Física, unidades reales y mecánica orbital.
- Contenido educativo nuevo (ciclo 3).

## Arquitectura

### Las texturas se declaran en los datos del cuerpo

Es la decisión estructural del ciclo. En `bodies/earth.js`, junto a `gravity` y
`orbitRadius`:

```js
textures: {
  day:      "textures/earth/day.jpg",
  clouds:   "textures/earth/clouds.jpg",
  lights:   "textures/earth/lights.jpg",   // .png si la prueba visual lo exige
  normal:   "textures/earth/normal.jpg",
  specular: "textures/earth/specular.jpg"
}
```

Las rutas son relativas a la página, y las páginas viven en `sistema_solar/`, así
que resuelven a `sistema_solar/textures/earth/`. La extensión de `lights` se fija
durante la implementación según el resultado de la comprobación visual descrita
en Riesgos.

`body-renderer.js` no sabrá nada de la Tierra en particular: verá que un cuerpo
declara texturas y montará el material fotorrealista; si no las declara, seguirá
generando la procedural de siempre.

El día que existan texturas de Marte, el trabajo es soltar los archivos y añadir
el campo en `bodies/mars.js`. Cero código. Esa extensibilidad es lo que
convierte este ciclo en cimiento del siguiente, en vez de en un caso especial.

### Composición del material

Cinco capas, todas hijas del grupo del cuerpo:

1. **Superficie** — `MeshPhongMaterial` con `map`, `normalMap` (escala 0.62),
   `specularMap`, color especular `0x7dbdff` y `shininess` 18, más un
   `onBeforeCompile` que inyecta el terminador día/noche y las luces de ciudad.

   **Phong y no Standard, deliberadamente.** El prototipo documenta el motivo en
   su propio código: el mapa especular es de los clásicos, no PBR, y representa
   los océanos con precisión. En `MeshPhongMaterial` encaja directo como
   `specularMap`; en `MeshStandardMaterial` habría que invertirlo y reinterpretarlo
   como rugosidad, que no es lo mismo y se ve peor. El resto de cuerpos siguen con
   `MeshStandardMaterial`: convivir materiales distintos en una escena es normal
   en Three.js y el tone mapping se aplica igual a ambos.
2. **Nubes** — esfera ligeramente mayor, `map` y `alphaMap` sobre el mismo mapa.
3. **Sombra de nubes** — proyectada sobre la superficie.
4. **Atmósfera exterior** — dispersión Rayleigh aproximada con banda de atardecer.
5. **Atmósfera interior** — halo del horizonte.

### Carga progresiva y reserva

La procedural se muestra al instante; la fotorrealista la sustituye cuando las
cinco texturas han cargado. Si alguna falla, se mantiene la procedural. Nadie ve
una esfera negra ni una página en blanco, y el sitio sigue funcionando sin red
después de la primera carga.

### Pipeline de color

En `body.js`, compartido por las 10 fichas: `outputColorSpace` sRGB,
`ACESFilmicToneMapping` con exposición 1.15, y anisotropía al máximo que permita
el dispositivo hasta 16. Es una mejora inmediata para los nueve cuerpos que
siguen con texturas dibujadas, sin descargar un solo archivo.

El *bloom* se reserva para el Sol y la Tierra, los dos cuerpos que emiten o
reflejan luz de forma notable, porque `EffectComposer` tiene coste por fotograma
y en los demás no aporta.

## Verificación

1. Las cinco texturas existen en disco y ninguna supera su presupuesto de tamaño.
2. `bodies/earth.js` declara `textures` y las cinco rutas resuelven a archivos
   reales. Un test lo comprueba, igual que el de integridad del ciclo 1 comprueba
   los 207 destinos.
3. Los cuerpos **sin** campo `textures` siguen recibiendo material procedural:
   el camino de reserva no se rompe.
4. Los 57 tests del ciclo 1 siguen en verde.
5. En navegador: la Tierra carga con nubes, luces nocturnas visibles en la cara
   oscura, y atmósfera en el borde. Sin errores de consola.
6. En navegador: las otras nueve fichas siguen funcionando, con el color mejorado
   y sin regresiones.
7. El prototipo pesa menos de 100 KB y sigue funcionando.
8. Con las texturas ausentes o inaccesibles, `earth.html` muestra la Tierra
   procedural y no una esfera negra.

## Riesgos

- **`lights` en JPEG puede ensuciarse.** Son luces sobre fondo negro y el JPEG
  puede dejar halos alrededor de los puntos brillantes. Comprobación visual
  obligatoria; si se ve mal, se queda en PNG y el total sube de 1945K a 2376K. No
  merece la pena degradar la imagen por 431K.
- **1,9 MB de descarga en la ficha de la Tierra.** Aceptable para una página que
  muestra un solo planeta a pantalla completa, y se cachea. La carga progresiva
  evita que se perciba como espera.
- **El tone mapping recalibra el color de las nueve fichas restantes.** Es el
  objetivo, pero cambia el aspecto de páginas que hoy alguien puede dar por
  buenas. Verificación visual de las diez, no solo de la Tierra.
- **Licencia sin resolver.** No bloquea la implementación; sí bloquea publicar.

## Supuestos

- Se mantiene el proyecto sin build: las texturas son archivos estáticos servidos
  tal cual, y `run.sh` los sirve sin configuración adicional.
- Three.js sigue cargándose por importmap desde CDN. El prototipo usa 0.185.1
  desde jsdelivr y el resto del sitio 0.185.0 desde unpkg; la implementación
  unifica en la versión que ya usa el sitio.
- Los datos educativos no se tocan. Añadir el campo `textures` es metadato de
  presentación, no contenido.
