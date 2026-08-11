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
| `api/` | El servicio que guarda el progreso (NestJS y Postgres). `dominio/` es lógica pura y con pruebas; Nest solo transporta |
| `infra/` | Dockerfile, nginx y el mapa de redirecciones |
| `tests/` | 133 tests |
| `tools/` | Generadores, como el del catálogo del cielo |
| `docs/superpowers/` | Specs y planes de las reformas en curso |

## Cómo se levanta

Dos aplicaciones, cada una con su stack:

```sh
./run.sh          # todo junto, en http://localhost:6767
./run.sh 8080     # otro puerto
./run.sh docker   # la imagen de verdad, en http://localhost:8080
```

`./run.sh` levanta las dos aplicaciones y delante un proxy que reparte por
prefijo igual que nginx. Así hay una sola dirección y los enlaces de una
aplicación a otra —«Entrar al Universo» desde el portal— también funcionan en
local, que es lo que no pasa levantando cada una por su cuenta. Los puertos
internos los busca libres al arrancar; el único que se elige es el del proxy.

Para trabajar en una sola, sin proxy:

```sh
npm run dev --workspace=materias    # http://localhost:3000
npm run dev --workspace=universo    # http://localhost:5173/universo/
```

El sitio anterior —`sistema_solar/`, un HTML por página— ya no existe: sus
módulos viven en `universo/` y sus URL redirigen a las nuevas.

## Cómo se publica

Tres servicios: la web —nginx con las dos aplicaciones compiladas dentro, sin
Node—, la API del progreso y su Postgres.

```sh
docker compose -f infra/compose.yaml up --build   # http://localhost:8080
```

El reparto es por prefijo: `/api/*` a la API, `/universo/*` a la aplicación del
universo y todo lo demás a materias. Por eso el universo no pide nada fuera de su prefijo —sus
assets, sus texturas y su favicon cuelgan de `/universo/`—; una petición suya a
la raíz acabaría en la otra aplicación.

Las URL del sitio anterior (`/sistema_solar/vega.html` y compañía) redirigen con
301 a su página nueva. El mapa se genera del catálogo, no se escribe a mano:

```sh
node tools/construir-redirecciones.mjs > infra/redirecciones.conf
```

### En Railway

Tres servicios en un proyecto, los dos primeros desde este repo:

| Servicio | Cómo se configura |
|---|---|
| la web | `RAILWAY_DOCKERFILE_PATH=infra/Dockerfile.web` y `API_ORIGIN=http://NOMBRE-DEL-SERVICIO-API.railway.internal:3100`. Es el único con dominio público. |
| la API | `RAILWAY_DOCKERFILE_PATH=infra/Dockerfile.api` y `DATABASE_URL=${{Postgres.DATABASE_URL}}`. Sin dominio público: solo la llama el proxy por la red privada. |
| Postgres | El de Railway. |

En los dos, el directorio raíz es la raíz del repo y no una subcarpeta.

**`API_ORIGIN` lleva el nombre que le hayas puesto al servicio de la API**, no la
palabra «api»: el nombre interno es `<servicio>.railway.internal`. Si se renombra
el servicio hay que cambiar la variable con él, y el síntoma de no hacerlo es que
la web funciona entera y solo deja de guardarse el progreso.

Y **solo dos servicios salen de este repo**. Railway detecta los workspaces de npm
y propone uno por paquete: `contenido` y `compartido` son bibliotecas sin nada que
arrancar, y `materias` y `universo` compilan a archivos que sirve la web. Además
las dos tienen que compartir dominio, o los enlaces entre ellas y el reparto por
prefijo dejan de funcionar.

Hay un Dockerfile por servicio y no uno con dos destinos porque Railway elige el
archivo, y elegir un destino dentro de él no está documentado. La fase de
compilación de los dos es idéntica y hay una prueba que lo vigila.

`PORT` no se toca: lo pone Railway y las dos imágenes lo respetan —nginx por
plantilla, la API leyéndolo del entorno—. Las dos escuchan también en IPv6,
porque los nombres de la red privada resuelven a las dos familias y en
`0.0.0.0` el servicio queda invisible para quien lo llame por IPv6.

El único servicio con dominio público es `web`: la API se alcanza por `/api`
a través suyo, así que no hace falta CORS ni exponerla.

## El progreso

Al entrar por primera vez se pregunta cómo guardarlo. Hoy solo hay una respuesta
posible —datos locales—; crear cuenta está anunciado y no implementado.

Con datos locales, el progreso que se ve vive en el navegador: es la fuente de
verdad de lo que pinta la interfaz, y por eso practicar funciona con la API
caída. En paralelo se manda una copia anónima de cada respuesta a Postgres —qué
pregunta, si se acertó, cuánto se tardó— para poder ver qué falla todo el mundo
y arreglar el contenido.

No se guarda nombre, ni correo, ni edad real. El identificador es un uuid
aleatorio que genera el navegador: si se pierde, se pierde el progreso, y eso lo
dice el propio modal sin letra pequeña. Mientras nadie elija modo no se guarda
nada, tampoco en el navegador.

`./run.sh` no levanta la API: hacerlo obligaría a montar Postgres para escribir
una página de contenido. Para trabajar en ella, `./run.sh docker`.

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
