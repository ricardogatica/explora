# Explora en un contenedor: se compila con Node y se sirve con nginx.
#
# El resultado no lleva Node dentro. Las dos apps compilan a archivos, así que
# la imagen final es nginx con dos directorios copiados: nada que reiniciar,
# nada que vigilar, y una superficie de ataque que es la de un servidor de
# archivos estáticos.

# ── Compilación ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS construccion
WORKDIR /repo

# Los manifiestos primero y las dependencias después: mientras no cambien, Docker
# reutiliza esta capa y no vuelve a descargar nada aunque cambie el contenido.
COPY package.json package-lock.json ./
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

RUN npm run build --workspace=materias && npm run build --workspace=universo

# ── Servicio ────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

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
