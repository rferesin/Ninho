ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="${NINHO_DB_NAME:-ninho}"
DB_USER="${NINHO_DB_USER:-ninho}"
DB_PASS="${NINHO_DB_PASS:-ninho}"
DB_HOST="${NINHO_DB_HOST:-localhost}"
DOCKER_DB_PORT="${NINHO_DOCKER_DB_PORT:-}"
LOCAL_DB_PORT="${NINHO_LOCAL_DB_PORT:-5432}"

compose() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    return 1
  fi
}

has_compose() {
  compose version >/dev/null 2>&1
}

port_in_use() {
  local port="$1"
  python3 - "$port" <<'PY'
import socket, sys
port = int(sys.argv[1])
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
try:
    sock.bind(("0.0.0.0", port))
except OSError:
    sys.exit(0)
finally:
    sock.close()
sys.exit(1)
PY
}

find_free_port() {
  local start="${1:-55432}"
  local port="$start"
  local end=$((start + 30))
  while [ "$port" -le "$end" ]; do
    if ! port_in_use "$port"; then
      echo "$port"
      return 0
    fi
    port=$((port + 1))
  done
  return 1
}

container_ready() {
  docker exec ninho-postgres pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1
}

wait_container_ready() {
  local i
  for i in $(seq 1 40); do
    if container_ready; then
      return 0
    fi
    sleep 1
  done
  return 1
}

host_login_ok() {
  local port="$1"
  if ! command -v psql >/dev/null 2>&1; then
    return 0
  fi
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$port" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" >/dev/null 2>&1
}

mapped_port() {
  docker port ninho-postgres 5432/tcp 2>/dev/null | head -1 | awk -F: '{print $NF}'
}

export_db_env() {
  local port="$1"
  export SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:${port}/${DB_NAME}"
  export SPRING_DATASOURCE_USERNAME="$DB_USER"
  export SPRING_DATASOURCE_PASSWORD="$DB_PASS"
  echo "[ninho] Banco: ${SPRING_DATASOURCE_URL}"
}

as_postgres() {
  if [ "$(id -u)" -eq 0 ]; then
    su -s /bin/bash postgres -c "$1"
    return
  fi
  if command -v sudo >/dev/null 2>&1; then
    sudo -u postgres bash -c "$1"
    return
  fi
  return 1
}

ensure_local_database() {
  echo "[ninho] Garantindo usuario e banco locais"
  as_postgres "psql -v ON_ERROR_STOP=1 -c \"DO \\\$\\\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}'; END IF; END \\\$\\\$;\""
  exists="$(as_postgres "psql -tAc \"SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'\"" | tr -d '[:space:]')"
  if [ "$exists" != "1" ]; then
    as_postgres "createdb -O ${DB_USER} ${DB_NAME}"
  fi
  as_postgres "psql -v ON_ERROR_STOP=1 -c \"GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};\""
}

start_docker_postgres() {
  if [ -z "$DOCKER_DB_PORT" ]; then
    current="$(mapped_port || true)"
    if [ -n "$current" ] && container_ready && host_login_ok "$current"; then
      DOCKER_DB_PORT="$current"
    else
      DOCKER_DB_PORT="$(find_free_port 55432)" || return 1
    fi
  fi

  export NINHO_DOCKER_DB_PORT="$DOCKER_DB_PORT"
  echo "[ninho] Subindo PostgreSQL no Docker (porta ${DOCKER_DB_PORT})"
  compose -f "$ROOT/docker-compose.yml" up -d --force-recreate

  if ! wait_container_ready; then
    echo "[ninho] Container ninho-postgres nao ficou pronto."
    docker logs ninho-postgres --tail 40 || true
    return 1
  fi

  if ! host_login_ok "$DOCKER_DB_PORT"; then
    echo "[ninho] Porta ${DOCKER_DB_PORT} nao aceitou usuario ${DB_USER}."
    echo "Outro Postgres provavelmente esta nessa porta. Tente de novo."
    return 1
  fi

  export_db_env "$DOCKER_DB_PORT"
}

prepare_database() {
  if has_compose; then
    if start_docker_postgres; then
      return 0
    fi
    echo "[ninho] Docker nao ficou utilizavel. Tentando PostgreSQL local."
  else
    echo "[ninho] Docker Compose nao encontrado."
  fi

  echo "[ninho] Tentando PostgreSQL local na porta ${LOCAL_DB_PORT}"
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl start postgresql >/dev/null 2>&1 || true
  fi
  ensure_local_database || true
  if host_login_ok "$LOCAL_DB_PORT"; then
    export_db_env "$LOCAL_DB_PORT"
    return 0
  fi

  echo "[ninho] Nao foi possivel autenticar no banco com ${DB_USER}/${DB_PASS}."
  echo "Feche outros Postgres na 5432/5433 ou instale Docker e rode de novo."
  return 1
}
