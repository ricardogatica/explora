#!/usr/bin/env bash
# Levanta Explora en local: las materias y el universo bajo una sola dirección.
#
#   ./run.sh          → http://localhost:6767
#   ./run.sh 8080     → otro puerto
#   ./run.sh docker   → la imagen de verdad, como en producción
#
# Arranca las dos aplicaciones en modo desarrollo, cada una en su puerto, y
# delante un proxy que reparte por prefijo igual que nginx. Así los enlaces
# entre ellas —«Entrar al Universo» desde el portal— funcionan también en local,
# que es lo que no pasa levantando cada una por su cuenta.
set -euo pipefail

# Control de trabajos activo aunque el script no sea interactivo: con él cada
# proceso en segundo plano arranca en su propio grupo, y eso es lo que permite
# pararlo entero al salir. Sin esto se mataba el envoltorio de npm y sus nietos
# —el servidor de verdad— seguían vivos con el puerto tomado.
set -m

cd "$(dirname "$0")"

# Los puertos internos se buscan libres al arrancar y no se fijan: son un
# detalle de fontanería que solo ve el proxy. Fijarlos hacía fallar el script
# entero porque otra cosa de la máquina —Docker, sin ir más lejos— ocupaba el
# 3000, y el mensaje culpaba a un ./run.sh anterior que no existía.
BASE_MATERIAS=3000
BASE_UNIVERSO=5173

# ── Modo docker: la imagen tal cual se publica ──────────────────────────────
if [[ "${1:-}" == "docker" ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "Falta docker. Instálalo o usa ./run.sh sin argumentos." >&2
    exit 1
  fi
  echo "Construyendo la imagen. Corre las pruebas dentro, así que tarda."
  echo "Cuando termine: http://localhost:8080"
  echo
  exec docker compose -f infra/compose.yaml up --build
fi

PORT="${1:-6767}"

# Puertos que Chrome, Edge y Firefox se niegan a abrir (ERR_UNSAFE_PORT).
# El servidor arrancaría igual, pero el navegador nunca podría conectarse.
# 6665-6669 son puertos históricos de IRC; de ahí que 6666 no sirva.
PUERTOS_BLOQUEADOS=" 1719 1720 1723 2049 4045 5060 5061 6000 6566 6665 6666 6667 6668 6669 6697 10080 "

if ! [[ "$PORT" =~ ^[0-9]+$ ]] || (( PORT < 1024 || PORT > 65535 )); then
  echo "Puerto no válido: $PORT. Usa un número entre 1024 y 65535." >&2
  exit 1
fi

if [[ "$PUERTOS_BLOQUEADOS" == *" $PORT "* ]]; then
  echo "El puerto $PORT no sirve: los navegadores lo bloquean (ERR_UNSAFE_PORT)." >&2
  echo "El servidor arrancaría, pero Chrome y Firefox se niegan a abrirlo." >&2
  echo "Prueba con: ./run.sh 6767" >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Faltan las dependencias. Instálalas con: npm install" >&2
  exit 1
fi

ocupado() { lsof -i ":$1" -sTCP:LISTEN >/dev/null 2>&1; }

# El único puerto que el script no puede elegir es el que ha pedido quien lo
# ejecuta: es el que va a escribir en el navegador.
if ocupado "$PORT"; then
  echo "El puerto $PORT ya está en uso. Usa otro: ./run.sh 7777" >&2
  exit 1
fi

# Los ya elegidos se descartan aparte de los ocupados: cuando se busca el
# segundo puerto, el primero todavía está libre —su servidor no ha arrancado— y
# sin esto las dos aplicaciones salían con el mismo número.
primerLibre() {
  local puerto="$1" limite=$(( $1 + 40 )) reservados=" $PORT ${*:2} "
  while (( puerto < limite )); do
    if ! ocupado "$puerto" && [[ "$reservados" != *" $puerto "* ]]; then
      echo "$puerto"
      return 0
    fi
    puerto=$(( puerto + 1 ))
  done
  echo "No encontré un puerto libre a partir de $1." >&2
  return 1
}

PUERTO_MATERIAS="$(primerLibre "$BASE_MATERIAS")"
PUERTO_UNIVERSO="$(primerLibre "$BASE_UNIVERSO" "$PUERTO_MATERIAS")"

# Al salir se para todo el grupo, no solo el proxy: si no, los dos servidores de
# desarrollo se quedan vivos en segundo plano y el siguiente ./run.sh se
# encuentra los puertos tomados sin saber por qué.
hijos=()
limpiar() {
  trap - EXIT INT TERM
  for pid in "${hijos[@]}"; do
    # Al grupo entero, con el menos delante: npm deja hijos suyos corriendo y
    # matar solo al padre los convierte en huérfanos con el puerto ocupado.
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap limpiar EXIT INT TERM

echo "Arrancando las dos aplicaciones…"
npm run dev --silent --workspace=materias -- --port "$PUERTO_MATERIAS" >/dev/null 2>&1 &
hijos+=($!)
npm run dev --silent --workspace=universo -- --port "$PUERTO_UNIVERSO" >/dev/null 2>&1 &
hijos+=($!)

# Esperar a que escuchen antes de levantar el proxy: si no, las primeras
# recargas devuelven 502 y parece que algo se ha roto.
esperar() {
  local puerto="$1" nombre="$2" intentos=0
  until ocupado "$puerto"; do
    intentos=$((intentos + 1))
    if (( intentos > 120 )); then
      echo "$nombre no arrancó en 60 segundos. Míralo con: npm run dev --workspace=$3" >&2
      exit 1
    fi
    sleep 0.5
  done
}

esperar "$PUERTO_MATERIAS" "Las materias" materias
esperar "$PUERTO_UNIVERSO" "El universo" universo

echo
# Sin `exec`: reemplazar el proceso se lleva por delante la trampa de limpieza y
# los dos servidores de desarrollo quedan huérfanos si el proxy se cae solo. Con
# Ctrl+C daba igual —la señal va a todo el grupo—, pero con cualquier otra forma
# de morir se quedaban vivos y el siguiente arranque no entendía nada.
# El pid en una variable y no `${hijos[-1]}`: los índices negativos son de bash
# 4.3 y macOS todavía trae la 3.2.
node tools/proxy-desarrollo.mjs "$PORT" "$PUERTO_MATERIAS" "$PUERTO_UNIVERSO" &
proxy=$!
hijos+=("$proxy")
wait "$proxy"
