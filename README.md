# Explora

Base de conocimiento interactivo para niños y niñas, pensada también para el
adulto que acompaña. Cada materia tiene contenido, preguntas y una progresión por
edades; el módulo del universo es un simulador 3D con 415 fichas de cuerpos,
estrellas y constelaciones.

## Qué hay dentro

| Carpeta | Qué es |
|---|---|
| `contenido/` | El contenido y su contrato: páginas, preguntas, bandas y validador |
| `materias/` | La aplicación de las materias (Next.js) |
| `compartido/` | Andamiaje 3D: canvas con desmontaje, reloj y primitivas |
| `universo/` | La aplicación del universo (React Router): `cielo/` los datos, `render/` los materiales de Three.js, `app/` las rutas y las escenas |
| `infra/` | Dockerfile, nginx y el mapa de redirecciones |
| `tests/` | 124 tests |
| `tools/` | Generadores, como el del catálogo del cielo |
| `docs/superpowers/` | Specs y planes de las reformas en curso |

## Cómo se levanta

Dos aplicaciones, cada una con su stack:

```sh
cd materias && npm run dev    # las materias, en http://localhost:3000
cd universo && npm run dev    # el universo, en http://localhost:5173/universo/
```

El sitio anterior —`sistema_solar/`, un HTML por página— ya no existe: sus
módulos viven en `universo/` y sus URL redirigen a las nuevas.

## Cómo se publica

Un contenedor, nginx y nada de Node en producción: las dos aplicaciones compilan
a archivos.

```sh
docker compose -f infra/compose.yaml up --build   # http://localhost:8080
```

El reparto es por prefijo: `/universo/*` va a la aplicación del universo y todo
lo demás a materias. Por eso el universo no pide nada fuera de su prefijo —sus
assets, sus texturas y su favicon cuelgan de `/universo/`—; una petición suya a
la raíz acabaría en la otra aplicación.

Las URL del sitio anterior (`/sistema_solar/vega.html` y compañía) redirigen con
301 a su página nueva. El mapa se genera del catálogo, no se escribe a mano:

```sh
node tools/construir-redirecciones.mjs > infra/redirecciones.conf
```

## Tests

```sh
node --test        # desde la raíz, no desde tests/
```

Cubren el catálogo del cielo, las proyecciones de las constelaciones, la
navegación, el movimiento por tiempo, el contrato de contenido y las
redirecciones. La imagen los corre durante su construcción: una imagen que no
pasa sus pruebas no llega a existir.

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
