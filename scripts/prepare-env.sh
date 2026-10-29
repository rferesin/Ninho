#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

echo "[ninho] Preparando ambiente"

missing=()
command -v java >/dev/null 2>&1 || missing+=("Java 17+")
command -v mvn >/dev/null 2>&1 || missing+=("Maven")
command -v node >/dev/null 2>&1 || missing+=("Node 20+")
command -v npm >/dev/null 2>&1 || missing+=("npm")

if [ "${#missing[@]}" -gt 0 ]; then
  echo "[ninho] Instale antes: ${missing[*]}"
  exit 1
fi

prepare_database

echo "[ninho] Instalando dependencias do frontend"
cd "$ROOT/frontend"
npm install

echo "[ninho] Ambiente pronto"
echo "Use ./scripts/start.sh para subir API e frontend"
