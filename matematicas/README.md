# Enciclopedia Interactiva de Matemáticas por Nivel y Edad

Proyecto educativo estático en HTML, CSS y JavaScript. Los contenidos están escritos en Markdown y los diagnósticos en JSON.

## Estructura

```txt
enciclopedia_matematicas_por_nivel/
├── index.html
├── assets/
│   ├── app.js
│   └── styles.css
├── data/
│   ├── diagnostics.json
│   ├── levels.json
│   ├── manifest.json
│   └── practice.json
└── pages/
    ├── inicio.md
    ├── nivel-1-3.md
    ├── nivel-3-5.md
    └── ...
```

## Cómo ejecutar

Desde la carpeta del proyecto:

```bash
python3 -m http.server 8080
```

Luego abre:

```txt
http://localhost:8080
```

## Rangos incluidos

- 1 a 3 años
- 3 a 5 años
- 6 a 8 años
- 9 a 11 años
- 12 a 14 años
- 15 a 17 años

## Cómo agregar un nuevo nivel

1. Crea un archivo Markdown en `pages/`.
2. Agrega el registro en `data/manifest.json`.
3. Agrega la definición del nivel en `data/levels.json`.
4. Agrega preguntas diagnósticas en `data/diagnostics.json`.

## Nota pedagógica

Los rangos de edad son orientativos. El desarrollo matemático puede variar por contexto, escolaridad, lenguaje, oportunidades de aprendizaje y necesidades individuales.
