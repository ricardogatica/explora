# Universo, Tierra y Sistema Solar 3D

Proyecto estático educativo en HTML/CSS/JavaScript con Three.js.

## Archivos
- `index.html`: vista principal del universo, sistema solar y evolución de la Tierra.
- `indice.html` / `indice.js`: índice filtrable de las 207 fichas (cuerpos, estrellas, constelaciones, galaxias).
- `sun.html`, `mercury.html`, `venus.html`, `earth.html`, `moon.html`, `mars.html`, `jupiter.html`, `saturn.html`, `uranus.html`, `neptune.html`.
- `solar-scale.html` / `solar-scale.js`: sistema solar a escala comparativa.
- `constellations.html` / `constellations-view.js`: mapa de constelaciones con deep-link `?slug=<slug>`.
- `star.html?slug=<slug>`: plantilla que sirve las 99 estrellas sin ficha propia.
- `acrux.html`, `antares.html`, `betelgeuse.html`, `polaris.html`, `proxima-centauri.html`, `rigel.html`, `sirius.html`, `vega.html`, `ton-618.html`, `milky-way.html`: fichas propias de estrellas y galaxias destacadas.
- `universe-body.js`: renderiza la ficha de cualquier cuerpo del universo (estrellas, galaxias) a partir de su slug.
- `referencias.html`: fuentes y referencias astronómicas del proyecto.
- `bodies/*.js`: datos, comportamiento temporal y etapas propias de cada cuerpo del sistema solar.
- `solar-system.js`, `body-renderer.js`, `star-renderer.js`, `galaxy-renderer.js`: orden, línea temporal, fórmulas de órbita y render 3D de cada tipo de objeto.
- `universe/*.js`: estrellas conocidas, constelaciones y galaxias.
- `nav-model.js`: catálogo, hermanos y migas. Lógica pura, sin DOM ni Three.js.
- `nav.js`: inyecta migas y hermanos en cada página.
- `styles.css`, `data.js`, `main.js`, `body.js`, `favicon.svg`.

## Tests
Desde la raíz del repositorio:

```bash
node --test
```

48 tests. Requiere Node 18 o superior. No hay dependencias que instalar.

## Uso
Abre `index.html` en un navegador moderno.

Si el navegador bloquea módulos desde `file://`, ejecuta en esta carpeta:

```bash
python3 -m http.server 8000
```

Luego abre:
`http://localhost:8000/index.html`
