#!/usr/bin/env bash
# Levanta la portada y las tres materias en un servidor local.
#
#   ./run.sh        → http://localhost:6767
#   ./run.sh 8080   → otro puerto
set -euo pipefail

PORT="${1:-6767}"
cd "$(dirname "$0")"

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

if ! command -v python3 >/dev/null 2>&1; then
  echo "Falta python3. Instálalo con: brew install python3" >&2
  exit 1
fi

if lsof -i ":$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "El puerto $PORT ya está en uso. Ciérralo con Ctrl+C o usa otro: ./run.sh 7777" >&2
  exit 1
fi

echo "Explora está en http://localhost:$PORT"
echo "Detén el servidor con Ctrl+C"
echo

# Se sirve con no-store en vez de `python3 -m http.server` a secas.
# Sin cabeceras de caché el navegador decide por su cuenta y guarda los módulos
# de JavaScript: editas un archivo, recargas, y sigues viendo el código viejo
# sin ningún aviso. Es un servidor de desarrollo, así que nunca cachea.
exec python3 - "$PORT" <<'PY'
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class SinCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def guess_type(self, path):
        # Algunos Python devuelven text/plain para .mjs y el navegador
        # entonces se niega a ejecutarlo como módulo.
        if str(path).endswith(".mjs"):
            return "text/javascript"
        return super().guess_type(path)

puerto = int(sys.argv[1])
ThreadingHTTPServer(("", puerto), partial(SinCache)).serve_forever()
PY
