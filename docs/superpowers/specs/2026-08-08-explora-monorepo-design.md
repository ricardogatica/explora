# Explora: monorepo, materias y universo

Diseño de la reorganización de `atlas.ricardogatica.com` en dos aplicaciones —materias
y sistema solar— con una ruta de aprendizaje de 5 a 17 años.

## Contexto

Hoy el repositorio es un portal estático que enlaza tres módulos independientes.
Medido, no estimado:

| Módulo | Contenido | Código | Peso |
|---|---|---|---|
| `lenguaje/` | 20 páginas `.md`, 17 preguntas | `app.js` de 304 líneas | 116 KB |
| `matematicas/` | 16 páginas `.md`, 10 preguntas, 6 niveles | `app.js` de 489 líneas | 120 KB |
| `sistema_solar/` | 415 fichas generadas | 33 módulos JS, shaders | 8 MB |

No hay build ni dependencias: se sirve con `run.sh`. Los módulos están
desacoplados —cada uno con su CSS y su JS— y el portal solo los enlaza.

Dos hechos que motivan el cambio:

1. **Los dos `app.js` ya divergieron**: 673 líneas de diferencia haciendo casi lo
   mismo (pintar markdown, filtrar por categoría, corregir ejercicios). Con seis
   materias habría seis dialectos.
2. **Las 415 fichas del universo no son direccionables**: 400 estrellas comparten
   `star.html?slug=…`. Un archivo, ninguna URL propia, invisibles para buscadores.

Y un requisito nuevo: una **ruta de aprendizaje de 5 a 17 años** que cruce las
materias, pensada para que un padre o una madre pueda apoyar el estudio en casa.

## Objetivo

Una base de conocimiento interactivo donde añadir una materia sea añadir
contenido, no escribir una aplicación; con una progresión por edades que atraviese
todas las materias; y donde cada materia pueda mostrar geometría y funciones en 3D.

## Decisiones ya tomadas

Estas no se rediscuten en la implementación:

| Decisión | Valor |
|---|---|
| Stack de materias | Next.js 16 (React) |
| Stack del sistema solar | React con React Router v7, sin Next |
| Estructura | Un monorepo, carpetas planas en la raíz |
| Bandas de edad | `5–6`, `7–8`, `9–10`, `11–12`, `13–14`, `15–17` |
| Publicación | Servidor propio, Docker y nginx por prefijo |
| Licencias | Código MIT, contenido CC BY-SA 4.0 |
| Colaboración externa | Fuera de alcance por ahora |

La elección de React sobre Vue fue del autor del proyecto. La recomendación
técnica había sido Nuxt por Content 3 (validación por esquema en el build); se
deja constancia porque la validación de contenido hay que resolverla igual, y en
este stack hay que montarla a mano —ver «Contrato de contenido».

## Invariantes

Requisitos que cualquier implementación debe cumplir. Si una tarea obliga a
romper uno, es señal de que la tarea está mal planteada.

1. **Los 82 tests actuales siguen pasando sin modificarlos**, con `node --test`
   desde la raíz. Cubren el catálogo del cielo, las proyecciones, la orientación
   de las figuras, la navegación y el movimiento por tiempo. Es lo que más costó
   verificar y no se toca.
2. **Los módulos de lógica pura siguen siendo ESM sin dependencias**:
   `nav-model.js`, `universe/*.js`, `earth-epochs.js`, `solar-system.js`,
   `tiempo.js`, `tools/construir-cielo.mjs`. No importan React ni nada del
   framework.
3. **Las escenas 3D no se reescriben.** Los módulos imperativos de Three.js se
   montan desde el ciclo de vida de React; no se traducen a React Three Fiber.
4. **Toda escena 3D se desmonta de verdad**: cancelar el `requestAnimationFrame`,
   quitar listeners, liberar geometrías, materiales y texturas, y perder el
   contexto WebGL. Sin esto, navegar por ocho fichas de planetas en una SPA agota
   el límite de contextos del navegador y el canvas se queda en negro **sin
   ningún error en consola**.
5. **Nada del movimiento depende del refresco de la pantalla.** Ya resuelto con
   `tiempo.js`; se conserva al migrar.
6. **La atribución del catálogo del cielo sobrevive.** `universe/sky-catalog.js`
   es obra derivada de HYG y Stellarium bajo CC BY-SA 4.0; su cabecera y la
   página de referencias tienen que seguir donde se puedan leer.

## Estructura del repositorio

```
atlas.ricardogatica.com/
├── materias/          Next.js 16 — seis materias, ruta 5–17
├── sistema_solar/     React + React Router v7 — simulador y 415 fichas
├── compartido/        ciclo de vida del canvas 3D, reloj, primitivas
├── contenido/         markdown y JSON de las materias (fuera de las apps)
├── docs/              specs y planes
├── tests/             los 82 tests actuales, más los que traiga la migración
├── tools/             generadores (construir-cielo.mjs)
└── infra/             Dockerfile(s) y configuración de nginx
```

`contenido/` vive fuera de `materias/` a propósito: el contenido es el activo del
proyecto y no debe quedar preso de la aplicación que hoy lo pinta. La app lo lee
en build.

## App de materias

**Next.js 16, App Router, exportación estática** (`output: 'export'`). No hay nada
en el producto que necesite un servidor: sin cuentas, sin persistencia, sin
formularios. El resultado es un directorio de archivos que nginx sirve, sin
proceso Node que mantener. Si algún día hace falta un servidor, es un cambio de
configuración, no una reescritura.

Consecuencia a tener presente: con `output: 'export'`, `dynamicParams: true` está
prohibido y **todas** las rutas dinámicas deben enumerarse con
`generateStaticParams`. Para un sitio generado desde archivos es lo natural.

`basePath` **no se usa**: la app posee `/matematicas`, `/lenguaje`, `/ciencias`…
como rutas propias, así que vive en la raíz del dominio.

Materias previstas: lenguaje, matemáticas, ciencias naturales, historia, biología
y física. Añadir una es crear su carpeta en `contenido/` y su entrada en el
índice de materias; no se escribe aplicación.

## Contrato de contenido

El corazón del diseño. Una sola forma para todas las materias, con dos tipos de
archivo.

### Páginas

Markdown con frontmatter:

```yaml
---
titulo: Tilde diacrítica
materia: lenguaje
categoria: Ortografía
bandas: [9-10, 11-12]        # en qué tramos de la ruta aparece
resumen: Diferencia palabras iguales con funciones distintas.
orden: 20                    # posición dentro de su banda
---
```

### Preguntas

JSON, con la forma que ya usan las dos materias actuales más el campo que falta:

```json
{
  "id": "acentuacion-1",
  "materia": "lenguaje",
  "categoria": "Acentuación",
  "banda": "9-10",
  "tipo": "opcion-multiple",
  "pregunta": "¿Cuál palabra está correctamente acentuada?",
  "opciones": ["cancion", "canción", "cáncion", "canciòn"],
  "respuesta": "canción",
  "explicacion": "«Canción» es aguda terminada en n, por eso lleva tilde."
}
```

Hoy las preguntas de matemáticas llevan `level` y **las 17 de lenguaje no llevan
ninguno**. Sin ese campo la ruta de aprendizaje no se puede ensamblar: es el dato
que la hace posible y hay que rellenarlo antes de escribir contenido nuevo.

### Validación

En este stack no hay equivalente directo a las colecciones con esquema de Nuxt
Content, así que se monta:

- Un esquema **Zod** por tipo de archivo, en `contenido/esquema.ts`.
- Un validador que recorre `contenido/` y **falla el build** si un archivo no
  cumple: banda inexistente, materia desconocida, pregunta cuya `respuesta` no
  está entre sus `opciones`, `id` repetido.
- El mismo validador corre como test con `node --test`, para que un error de
  contenido se vea antes de compilar.

Esa última regla —la respuesta tiene que estar entre las opciones— parece obvia y
es justo el error que nadie nota hasta que un niño se encuentra un ejercicio sin
solución correcta.

## Ruta de aprendizaje 5–17

Seis bandas que **particionan** las edades, sin huecos ni solapes:

`5–6` · `7–8` · `9–10` · `11–12` · `13–14` · `15–17`

Las bandas actuales de matemáticas (`1–3`, `3–5`, `6–8`, `9–11`, `12–14`, `15–17`)
tenían los 3 años en dos tramos y un hueco entre los 5 y los 6; se sustituyen.

- URL propia, `/ruta`, porque cruza materias y no cuelga de ninguna.
- Para cada banda: qué se espera a esa edad, qué páginas la componen en cada
  materia, y sus preguntas.
- Pensada para que la lea un adulto que acompaña, no solo el niño.

El contenido de matemáticas escrito para 1–5 años (`nivel-1-3`, `nivel-3-5`) **se
conserva** marcado como `previo`: accesible, fuera de la progresión. Está escrito
y sirve; tirarlo por un cambio de bandas sería perder trabajo bueno.

Re-etiquetado necesario: 10 preguntas de matemáticas y 17 de lenguaje. Poco ahora,
mucho con seis materias.

## Visualizaciones 3D en las materias

Cada materia puede incrustar escenas manipulables: una esfera, un cubo, un prisma
que se gira con el dedo y del que se leen sus medidas. Para los mayores, un
graficador que muestre qué forma tiene una ecuación.

- Se declaran **desde el markdown**, con un componente por nombre y parámetros,
  para que escribir contenido no obligue a tocar código.
- Se montan sobre el mismo andamiaje que las escenas del universo (ver
  `compartido/`), así el desmontaje está resuelto una sola vez.
- **El graficador de ecuaciones queda fuera de este diseño.** No es lo mismo un
  cubo que se rota que evaluar expresiones arbitrarias y dibujar superficies
  paramétricas —con su parser, sus casos degenerados y su rendimiento—. Tendrá su
  propio spec.

## App del sistema solar

**React con React Router v7 en modo framework** (Vite), configurado con
`ssr: false` y `prerender`, que genera un HTML por ruta y se sirve como archivos
estáticos. Es «solo React» y conserva lo único que justificaba mover el universo a
un framework: las fichas dejan de ser un `?slug=` y pasan a ser páginas.

- Montada bajo `/universo` con `basename`.
- Las 415 rutas de ficha se enumeran en el `prerender` leyendo el catálogo, que ya
  es un módulo importable.
- Las seis escenas (`main`, `body`, `solar-scale`, `star-scale`,
  `constellations-view`, `universe-body`) pasan de ejecutarse al importarse a
  exponer `montarEscena(canvas, opciones)` que devuelve una función de
  desmontaje. Es el cambio de forma más grande de la migración y el que más
  cuidado necesita: hoy leen `document.getElementById` en el cuerpo del módulo y
  arrancan un bucle que nunca termina.
- Los slugs de datos no cambian (`earth`, `vega`): tocar la identidad en el
  catálogo, los tests y las URLs a la vez es pedir problemas. Solo se traducen las
  rutas.

## `compartido/`

Deliberadamente pequeño. Solo entra lo que tenga dos consumidores reales:

- **Ciclo de vida del canvas**: crear renderer, cámara y controles, reaccionar al
  redimensionado y desmontar liberando todo. Lo usan las escenas del universo y
  las demostraciones de geometría.
- **`tiempo.js`**: ya escrito y probado; ata el movimiento al tiempo y no al
  refresco.
- **Primitivas 3D**: esfera, cubo, prisma.

No entra el esquema de contenido (solo lo usa materias) ni el sistema visual
(mientras las dos apps no se parezcan). Si algo acaba teniendo un solo consumidor,
se devuelve a su app.

## Despliegue

Docker y nginx enrutando por prefijo:

```
explora.ricardogatica.com/universo/*   →  estáticos de sistema_solar
explora.ricardogatica.com/*            →  estáticos de materias
```

Como las dos apps compilan a archivos, **basta un contenedor de nginx** con los
dos builds montados: no hay proceso Node en producción. Si en el futuro materias
necesita servidor, ese contenedor pasa a ser Node y la regla de nginx no cambia.

Las texturas (7 MB) se sirven como estáticos con caché larga; el HTML, sin caché.
El `run.sh` actual —que sirve con `Cache-Control: no-store` para desarrollo— se
conserva mientras queden partes sin migrar.

## Fuera de alcance

- El graficador de ecuaciones (spec propio).
- Contribución externa: sin `CONTRIBUTING`, plantillas ni CI de terceros. Sí se
  añaden `LICENSE` (MIT) y la nota de licencia del contenido, porque ya hay
  material de terceros redistribuido.
- Traducción o i18n. El módulo de idiomas, cuando llegue, dirá qué necesita.
- Ejercicios para el universo (0 hoy, frente a 17 y 40 en las otras materias).

## Riesgos

| Riesgo | Por qué importa | Mitigación |
|---|---|---|
| Fuga de contextos WebGL | Falla en silencio: canvas negro sin error, y solo tras varias navegaciones | Desmontaje obligatorio y un test que navegue entre fichas y compruebe que el contexto se libera |
| Contenido inválido | Sin validación por esquema del framework, un `.md` mal etiquetado desaparece de la ruta sin avisar | Validador Zod que falla el build y corre como test |
| Migración de las escenas | Es el código con más defectos encontrados y arreglados del proyecto | Se migran de una en una, verificando en navegador, no en lote |
| Perder la atribución | Obligación legal del CC BY-SA, no una cortesía | Invariante 6 y test que comprueba que la página de referencias sigue enlazada |

## Fases

Cada una deja el sitio funcionando; ninguna es un big bang.

1. **Contrato de contenido y validador.** Esquemas, re-etiquetado de las 27
   preguntas existentes, bandas nuevas. Sin framework todavía: solo datos y tests.
2. **App de materias** con lenguaje y matemáticas migradas y la ruta `/ruta`.
   Aquí mueren los dos `app.js`.
3. **Andamiaje 3D compartido** y las primeras primitivas incrustadas en contenido.
4. **App del sistema solar**: rutas, fichas prerenderizadas y escenas con
   desmontaje.
5. **Despliegue** con Docker y nginx.

El orden no es negociable en un punto: la fase 1 va primero. Cada página escrita
antes de fijar el contrato es una página que habrá que re-etiquetar.
