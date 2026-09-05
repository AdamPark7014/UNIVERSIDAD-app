#!/usr/bin/env bash
# Copia school.yml al file-provider de Traefik.
# Sin esto, school.adam.delpozodelvalle.com responde 404 aunque los contenedores estén bien.
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)/traefik/school.yml"
DST="/opt/traefik/config/school.yml"
if [[ ! -f "$SRC" ]]; then
  echo "No existe $SRC" >&2
  exit 1
fi
cp -a "$SRC" "$DST"
echo "OK: $DST"
ls -la "$DST"
