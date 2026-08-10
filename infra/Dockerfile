# Explora en contenedores: se compila una vez y salen dos imágenes.
#
#   target: web  → nginx con las dos aplicaciones dentro. Sin Node.
#   target: api  → el servicio que guarda el progreso.
#
# La separación no es capricho: el contenido son archivos y no debe depender de
# que una base de datos esté viva. Si la API se cae, la web se sigue leyendo
# entera y lo único que falla es guardar estadísticas.

# ── Compilación ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS construccion
WORKDIR /repo

# Los manifiestos primero y las dependencias después: mientras no cambien, Docker
# reutiliza esta capa y no vuelve a descargar nada aunque cambie el contenido.
COPY package.json package-lock.json ./
COPY api/package.json           api/
COPY contenido/package.json     contenido/
COPY compartido/package.json    compartido/
COPY materias/package.json      materias/
COPY universo/package.json      universo/
RUN npm ci

COPY . .

# Las pruebas corren aquí: una imagen que no pasa sus pruebas no llega a
# construirse. Incluyen el validador del contenido, así que un .md mal etiquetado
# —que si no desaparecería de la ruta sin avisar— para el despliegue.
RUN node --test

RUN npm run build --workspace=materias \
 && npm run build --workspace=universo \
 && npm run build --workspace=explora-api

# ── La web: nginx y archivos ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS web

COPY infra/nginx.conf         /etc/nginx/conf.d/default.conf
COPY infra/redirecciones.conf /etc/nginx/conf.d/redirecciones.conf

# Materias ocupa la raíz del dominio.
COPY --from=construccion /repo/materias/out/ /usr/share/nginx/html/

# Del build del universo solo su prefijo: en la raíz deja un index.html de
# reserva para funcionar como SPA que taparía el portal de materias.
COPY --from=construccion /repo/universo/build/client/universo/ /usr/share/nginx/html/universo/

# Ese mismo archivo de reserva, dentro del prefijo y con otro nombre: es lo que
# nginx sirve cuando una URL de /universo/ no corresponde a ninguna página.
COPY --from=construccion /repo/universo/build/client/index.html /usr/share/nginx/html/universo/spa.html

# Comprueba que la configuración es válida al construir la imagen y no al
# arrancarla en el servidor.
RUN nginx -t

# ── La API: Node y nada más ─────────────────────────────────────────────────
FROM node:22-alpine AS api
WORKDIR /repo
ENV NODE_ENV=production

# Solo lo necesario para arrancar el servicio: ni el contenido, ni las escenas
# 3D, ni las dependencias de las dos aplicaciones web.
COPY package.json package-lock.json ./
COPY api/package.json       api/
COPY contenido/package.json contenido/
RUN npm ci --omit=dev --workspace=explora-api --include-workspace-root

COPY --from=construccion /repo/api/dist/ api/dist/
# El dominio importa el contrato de contenido —materias, bandas, familias— para
# validar contra él en vez de contra una lista escrita aparte que se quedaría
# vieja al añadir una materia.
COPY contenido/ contenido/

# Sin privilegios: este proceso solo tiene que hablar con Postgres.
USER node
EXPOSE 3100
CMD ["node", "api/dist/src/main.js"]
