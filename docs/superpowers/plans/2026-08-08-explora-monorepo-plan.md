# Plan de implementación: monorepo Explora

> Ejecuta este plan tarea por tarea. Cada tarea termina con sus tests en verde y
> un commit. Spec: `docs/superpowers/specs/2026-08-08-explora-monorepo-design.md`.

**Objetivo:** reorganizar el proyecto en dos aplicaciones —materias (Next) y
sistema solar (React)— con un contrato de contenido común y una ruta de
aprendizaje de 5 a 17 años.

**Stack:** Next.js 16 (App Router, `output: 'export'`), React Router v7 en modo
framework (`ssr: false`, `prerender`), Docker y nginx.

## Restricciones globales

Aplican a todas las tareas:

1. Los 82 tests actuales pasan sin modificarlos: `node --test` desde la raíz.
2. Los módulos de lógica pura no adquieren dependencias.
3. Las escenas de Three.js no se reescriben; se montan y se desmontan.
4. Toda escena 3D libera su contexto WebGL al desmontarse.
5. El movimiento va por tiempo, nunca por cuadro.
6. La atribución CC BY-SA del catálogo del cielo sobrevive visible.
7. **Cada fase deja el sitio actual funcionando.** Nada de estados intermedios
   rotos.

## Desviación deliberada del spec

El spec propone Zod para validar el contenido. La fase 1 no tiene build ni
`package.json`, y las reglas son de forma y de integridad referencial, no de
tipos exóticos. Se implementa el validador en **ESM plano, sin dependencias**:

- Mantiene el repositorio sin `node_modules` hasta que llegue Next.
- El mismo validador lo usan los tests y, en la fase 2, el build de la app: una
  sola definición en vez de un esquema Zod y unos tests que lo repiten.

Si en la fase 2 la app necesita tipos de TypeScript derivados del esquema, se
envuelve con Zod en su frontera. La decisión se revisa entonces, no antes.

---

# Fase 1 — Contrato de contenido y validador

No entra ningún framework. Solo datos, un validador y sus tests. Al terminar,
el sitio funciona exactamente igual que ahora.

### Tarea 1: Las bandas de edad

**Archivos:**
- Crear: `contenido/bandas.js`
- Test: `tests/contenido-bandas.test.mjs`

Las seis bandas más `previo`, con sus edades. La propiedad que importa es que
**particionen** de 5 a 17: sin huecos ni solapes. Las bandas viejas de
matemáticas (`1-3`, `3-5`, `6-8`, `9-11`, `12-14`, `15-17`) tenían los 3 años en
dos tramos y un hueco entre los 5 y los 6.

- [ ] **Paso 1:** escribir el test de partición: para cada edad de 5 a 17 hay
      exactamente una banda que la contiene; ninguna banda se solapa con otra;
      la lista está ordenada; `previo` queda fuera de la ruta.
- [ ] **Paso 2:** correr y ver fallar (`node --test`).
- [ ] **Paso 3:** implementar `contenido/bandas.js` con `BANDAS`, `PREVIO`,
      `bandaPorId()`, `bandaDeEdad()`, `esBandaDeRuta()`.
- [ ] **Paso 4:** correr y ver pasar.
- [ ] **Paso 5:** commit.

### Tarea 2: El esquema y el validador

**Archivos:**
- Crear: `contenido/esquema.js`
- Test: `tests/contenido-esquema.test.mjs`

Cinco tipos de pregunta, con reglas propias de integridad. Estas son las que se
rompen en silencio y dejan un ejercicio sin solución:

| Tipo | Reglas |
|---|---|
| `multiple-choice` | `answer` está entre `options`; al menos dos opciones |
| `fill` | `answer` no vacía; `accepted` no repite la respuesta |
| `observation` | las claves de `score` son exactamente las `options` |
| `drag-match` | las claves de `answer` son `items`; sus valores están en `targets` |
| `drag-order` | `answer` es una permutación de `items` |

Y dos familias: `practica` (con `categoria`, `explicacion`) y `diagnostico`
(con `habilidad`, `retroalimentacion`, y puntaje en las observaciones).

Reglas comunes: `id` único en todo el corpus, `materia` conocida, `banda`
existente, `tipo` conocido.

- [ ] **Paso 1:** tests con casos inválidos, uno por regla, comprobando que el
      validador señala **qué** archivo, **qué** id y **qué** regla.
- [ ] **Paso 2:** correr y ver fallar.
- [ ] **Paso 3:** implementar `validarPregunta()` y `validarCorpus()`, que
      devuelven una lista de errores legibles en vez de lanzar.
- [ ] **Paso 4:** correr y ver pasar.
- [ ] **Paso 5:** commit.

### Tarea 3: Etiquetar el contenido existente

**Archivos:**
- Crear: `contenido/migracion-niveles.js`
- Modificar: `matematicas/data/practice.json`, `matematicas/data/diagnostics.json`,
  `lenguaje/data/exercises.json`
- Test: `tests/contenido-corpus.test.mjs`

57 elementos: 10 preguntas de práctica y 30 de diagnóstico en matemáticas (con
`level` viejo) y 17 de lenguaje (**sin nivel ninguno**).

Se **añade** `banda` y se conserva `level`: las aplicaciones actuales filtran por
`level` y romperlas sería violar la restricción 7. `level` desaparece en la fase 2.

El mapa de niveles viejos a bandas nuevas y la asignación de las 17 de lenguaje
son **juicios de contenido, no datos**: van en un solo archivo, documentados como
aproximaciones que su autor debe revisar, igual que las posiciones de las placas
tectónicas.

- [ ] **Paso 1:** escribir el test que valida los tres archivos reales contra el
      esquema y exige que **todo** elemento tenga banda.
- [ ] **Paso 2:** correr y ver fallar.
- [ ] **Paso 3:** escribir `contenido/migracion-niveles.js` con los dos mapas.
- [ ] **Paso 4:** aplicar las bandas con un script de una sola pasada.
- [ ] **Paso 5:** correr los tests y comprobar a mano que los dos sitios siguen
      funcionando en el navegador.
- [ ] **Paso 6:** commit.

### Tarea 4: Cobertura de la ruta

**Archivos:**
- Test: `tests/contenido-ruta.test.mjs`

Una ruta con huecos no es una ruta. El test no exige que todo esté cubierto
—eso llegará con el contenido— pero sí que el hueco sea **visible**: informa de
qué bandas están vacías por materia, y falla solo si una banda de la ruta se
queda sin ninguna pregunta en ninguna materia.

- [ ] **Paso 1:** escribir el test.
- [ ] **Paso 2:** correrlo; si falla, es un hueco real: se anota en el informe de
      la fase, no se tapa con contenido inventado.
- [ ] **Paso 3:** commit.

### Tarea 5: Licencias

**Archivos:**
- Crear: `LICENSE`, `LICENSE-CONTENIDO`
- Modificar: `README.md` (crear si no existe)

MIT para el código, CC BY-SA 4.0 para el contenido, con la nota de que
`sistema_solar/universe/sky-catalog.js` es obra derivada y arrastra su propia
licencia, y que las texturas son CC BY 4.0 de Solar System Scope.

- [ ] **Paso 1:** escribir los archivos.
- [ ] **Paso 2:** test que comprueba que existen y que el README nombra las tres
      licencias.
- [ ] **Paso 3:** commit.

---

# Fases 2 a 5 — esquema de tareas

Se detallan al llegar a ellas, y no antes, por un motivo concreto: su contenido
depende de decisiones que se toman ejecutando la fase 1 —la forma final del
esquema, cómo queda el corpus, qué huecos aparecen en la ruta—. Escribir ahora
sus pasos con código exacto sería inventar; el spec ya fija el **qué** y el
**porqué**, que es lo que no debe cambiar.

## Fase 2 — App de materias (Next.js 16)

1. Andamiaje: `materias/` con Next 16, App Router, `output: 'export'`, sin `basePath`.
2. Mover `lenguaje/pages/*` y `matematicas/pages/*` a `contenido/<materia>/`, con
   el frontmatter que hoy vive en `manifest.json` (las páginas **no tienen**
   frontmatter: la metadata está en el manifiesto, y hay que fusionarla).
3. Lector de contenido en build, apoyado en el validador de la fase 1.
4. Rutas: `/[materia]`, `/[materia]/[pagina]`, `/ruta`, `/ruta/[banda]`.
5. Un solo visor de preguntas para los cinco tipos: aquí mueren los dos `app.js`.
6. Borrar `lenguaje/` y `matematicas/` viejos y redirigir sus URLs.

## Fase 3 — Andamiaje 3D compartido

1. `compartido/canvas.js`: crear renderer, cámara y controles; redimensionado;
   **desmontaje** que libera geometrías, materiales, texturas y el contexto.
2. Mover `sistema_solar/tiempo.js` a `compartido/` sin cambiar su API.
3. Primitivas: esfera, cubo, prisma, con medidas visibles.
4. Incrustarlas desde el markdown por nombre y parámetros.
5. Test que monta y desmonta N veces y comprueba que no crecen los contextos.

## Fase 4 — App del sistema solar (React Router v7)

1. Andamiaje con `ssr: false`, `prerender`, `basename: "/universo"`.
2. Convertir las seis escenas a `montarEscena(canvas, opciones) → desmontar`.
   Una por una, verificando en navegador. Es el trabajo más delicado del plan.
3. Rutas de ficha y prerender de las 415 leyendo el catálogo.
4. Redirecciones desde las URLs viejas (`sistema_solar/*.html`).

## Fase 5 — Despliegue

1. Build estático de las dos apps.
2. `infra/nginx.conf`: `/universo/*` al universo, el resto a materias.
3. `infra/Dockerfile` y `compose`.
4. Caché: larga para texturas y assets con hash, nula para HTML.

---

## Orden

La fase 1 va primero y no se negocia: cada página escrita antes de fijar el
contrato es una página que habrá que re-etiquetar. Las fases 3 y 4 pueden
solaparse; la 5 necesita las dos apps compilando.
