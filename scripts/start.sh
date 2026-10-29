#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

prepare_database

cleanup() {
  if [ -n "${BACKEND_PID:-}" ]; then
    kill "${BACKEND_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

echo "[ninho] Iniciando API em :3001"
cd "$ROOT/backend"
mvn spring-boot:run &
BACKEND_PID=$!

echo "[ninho] Aguardando API"
ready=0
for _ in $(seq 1 60); do
  if curl -sf http://localhost:3001/api/health >/dev/null 2>&1; then
    ready=1
    break
  fi
  if ! kill -0 "${BACKEND_PID}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if [ "$ready" -ne 1 ]; then
  echo "[ninho] API nao subiu. Confira se o PostgreSQL esta no ar e se a URL acima esta correta."
  exit 1
fi

echo "[ninho] Iniciando frontend em :4200"
cd "$ROOT/frontend"
npm start
