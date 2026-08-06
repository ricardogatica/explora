# Universo, Tierra y Sistema Solar 3D

Proyecto estático educativo en HTML/CSS/JavaScript con Three.js.

## Archivos
- `index.html`: vista principal del universo, sistema solar y evolución de la Tierra.
- `sun.html`, `mercury.html`, `venus.html`, `earth.html`, `moon.html`, `mars.html`, `jupiter.html`, `saturn.html`, `uranus.html`, `neptune.html`.
- `bodies/*.js`: datos, comportamiento temporal y etapas propias de cada cuerpo.
- `solar-system.js`: orden, línea temporal y fórmulas de órbita.
- `universe/*.js`: estrellas conocidas y constelaciones.
- `styles.css`, `data.js`, `main.js`, `body.js`.

## Uso
Abre `index.html` en un navegador moderno.

Si el navegador bloquea módulos desde `file://`, ejecuta en esta carpeta:

```bash
python3 -m http.server 8000
```

Luego abre:
`http://localhost:8000/index.html`
