#!/bin/sh
# De dónde saca nginx su DNS, averiguado al arrancar.
#
# nginx no lee /etc/resolv.conf: hay que decirle el servidor de nombres a mano.
# El valor cambia según dónde corra el contenedor —127.0.0.11 en Docker, otro en
# Railway o en cualquier nube— así que escribirlo en la configuración lo ataría a
# un sitio. Aquí se lee del propio contenedor y se deja en un include.
#
# Hace falta porque la dirección de la API va en una variable, y con la forma
# variable nginx resuelve en cada petición en vez de al arrancar. Eso es
# deliberado: así el sitio se sirve aunque la API todavía no esté levantada.
#
# Este script lo ejecuta la imagen de nginx sola: todo lo que hay en
# /docker-entrypoint.d se corre antes de arrancar el servidor.
set -eu

mkdir -p /etc/nginx/extra

# Fuera de conf.d: ahí nginx incluye solo todo lo que acabe en .conf, y el
# include explícito de la plantilla lo cargaría por segunda vez.
DESTINO=/etc/nginx/extra/resolver.conf

SERVIDORES=$(awk '/^nameserver/ { printf "%s ", $2 }' /etc/resolv.conf)

if [ -z "$SERVIDORES" ]; then
  # Sin DNS que consultar, el bloque /api no podría resolver nada. El resto del
  # sitio —que es todo lo demás— se sirve igual, así que no se aborta.
  echo "resolver: no encontré ningún nameserver; /api no resolverá" >&2
  : > "$DESTINO"
  exit 0
fi

# ipv6=on por si la red privada de la plataforma resuelve a IPv6, que es el caso
# de Railway. valid=10s para que un reinicio de la API se note pronto.
echo "resolver $SERVIDORES valid=10s ipv6=on;" > "$DESTINO"
echo "resolver: usando $SERVIDORES"
