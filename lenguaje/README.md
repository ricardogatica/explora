# Enciclopedia Interactiva de Ortografía y Gramática Española

Proyecto educativo estático en HTML, CSS y JavaScript, con páginas de contenido escritas en Markdown.

## Estructura

```txt
enciclopedia_espanol_interactiva/
├── index.html
├── assets/
│   ├── app.js
│   └── styles.css
├── data/
│   ├── exercises.json
│   └── manifest.json
└── pages/
    ├── inicio.md
    ├── acentuacion-general.md
    ├── tilde-diacritica.md
    └── ...
```

## Cómo ejecutarlo

### Opción 1: servidor local recomendado

Desde la carpeta del proyecto:

```bash
python3 -m http.server 8080
```

Luego abre:

```txt
http://localhost:8080
```

### Opción 2: hosting estático

Puedes subir la carpeta completa a Netlify, Vercel, GitHub Pages, S3, Nginx o cualquier hosting estático.

## Cómo agregar una nueva página

1. Crea un archivo `.md` dentro de `pages/`.
2. Agrega su referencia en `data/manifest.json`.

Ejemplo:

```json
{
  "id": "nueva-regla",
  "title": "Nueva regla",
  "category": "Ortografía",
  "description": "Descripción breve de la regla."
}
```

El archivo debe llamarse:

```txt
pages/nueva-regla.md
```

## Cómo agregar ejercicios

Edita `data/exercises.json`.

Ejercicio de selección múltiple:

```json
{
  "id": "ejemplo-1",
  "category": "Acentuación",
  "type": "multiple-choice",
  "question": "¿Cuál palabra está correctamente acentuada?",
  "options": ["cancion", "canción"],
  "answer": "canción",
  "explanation": "Es aguda terminada en n."
}
```

Ejercicio de respuesta escrita:

```json
{
  "id": "ejemplo-2",
  "category": "Tilde diacrítica",
  "type": "fill",
  "question": "Corrige: Tu tienes tu libro.",
  "answer": "Tú tienes tu libro.",
  "accepted": ["Tú tienes tu libro"],
  "explanation": "Tú pronombre lleva tilde; tu posesivo no."
}
```

## Nota técnica

El proyecto carga archivos `.md` y `.json` mediante `fetch`. Algunos navegadores bloquean esa carga al abrir `index.html` directamente desde el sistema de archivos. Por eso se recomienda usar un servidor local.
