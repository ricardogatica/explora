#!/bin/sh
# De dónde saca nginx su DNS, averiguado al arrancar.
#
# nginx no lee /etc/resolv.conf: hay que decirle el servidor de nombres a mano.
# El valor cambia según dónde corra el contenedor —127.0.0.11 en Docker, una
# dirección IPv6 privada en Railway— así que escribirlo en la configuración lo
# ataría a un sitio. Aquí se lee del propio contenedor y se deja en un include.
#
# Hace falta porque la dirección de la API va en una variable, y con la forma
# variable nginx resuelve en cada petición en vez de al arrancar. Eso es
# deliberado: así el sitio se sirve aunque la API todavía no esté levantada.
#
# Este script lo ejecuta la imagen de nginx sola: todo lo que hay en
# /docker-entrypoint.d se corre antes de arrancar el servidor.
set -eu

# Las dos rutas se pueden cambiar para poder probar esto sin ser root ni tocar
# el DNS de la máquina. En el contenedor valen los valores de siempre.
FUENTE=${RESOLVER_FUENTE:-/etc/resolv.conf}
DESTINO=${RESOLVER_DESTINO:-/etc/nginx/extra/resolver.conf}

# Fuera de conf.d: ahí nginx incluye solo todo lo que acabe en .conf, y el
# include explícito de la plantilla lo cargaría por segunda vez.
mkdir -p "$(dirname "$DESTINO")"

if [ ! -r "$FUENTE" ]; then
  echo "resolver: no puedo leer $FUENTE; /api no resolverá" >&2
  : > "$DESTINO"
  exit 0
fi

# Una dirección IPv6 va entre corchetes o nginx lee el último grupo como si
# fuera un puerto: con «fd12::10» a secas se niega a arrancar diciendo «invalid
# port in resolver». Es el DNS que da Railway, así que sin esto no levanta.
LISTA=""
for direccion in $(awk '/^nameserver/ { print $2 }' "$FUENTE"); do
  case $direccion in
    \[*\]) LISTA="$LISTA $direccion" ;;   # ya venía entre corchetes
    *:*)   LISTA="$LISTA [$direccion]" ;; # IPv6
    *)     LISTA="$LISTA $direccion" ;;   # IPv4
  esac
done
LISTA=${LISTA# }

if [ -z "$LISTA" ]; then
  # Sin DNS que consultar, el bloque /api no podría resolver nada. El resto del
  # sitio —que es todo lo demás— se sirve igual, así que no se aborta.
  echo "resolver: no encontré ningún nameserver; /api no resolverá" >&2
  : > "$DESTINO"
  exit 0
fi

# ipv6=on por si la red privada de la plataforma resuelve a IPv6, que es el caso
# de Railway. valid=10s para que un reinicio de la API se note pronto.
echo "resolver $LISTA valid=10s ipv6=on;" > "$DESTINO"
echo "resolver: usando $LISTA"
