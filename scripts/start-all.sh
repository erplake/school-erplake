#!/usr/bin/env bash
set -euo pipefail

# Similar semantics to start-all.ps1 (subset) for Linux / macOS
# Flags:
#   --rebuild        : docker compose up --build
#   --no-web         : skip web
#   --no-api         : skip api
#   --no-db          : skip docker compose services
#   --attach         : after start, tail logs (Ctrl+C to detach)
#   --open           : open browser to web URL (xdg-open)
#   --api-port N     : desired api port (auto increments if busy)
#   --web-port N     : desired web port (auto increments if busy)
#   --env-file FILE  : env file to preload (default .env.local)
#   --no-migrate     : skip alembic upgrade head
# Environment:
#   APP_HOME inferred as repo root (parent of scripts dir)
# Outputs:
#   scripts/.state/{api.pid,web.pid,db.docker,api.port,web.port}
#   logs under scripts/.state/logs/*.log

API_PORT=8000
WEB_PORT=5173
REBUILD=0
NO_WEB=0
NO_API=0
NO_DB=0
ATTACH=0
OPEN_BROWSER=0
ENV_FILE=".env.local"
NO_MIGRATE=0

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --rebuild) REBUILD=1; shift ;;
    --no-web) NO_WEB=1; shift ;;
    --no-api) NO_API=1; shift ;;
    --no-db) NO_DB=1; shift ;;
    --attach) ATTACH=1; shift ;;
    --open) OPEN_BROWSER=1; shift ;;
    --api-port) API_PORT="$2"; shift 2 ;;
    --web-port) WEB_PORT="$2"; shift 2 ;;
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --no-migrate) NO_MIGRATE=1; shift ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# //'; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_HOME="$(cd "$SCRIPT_DIR/.." && pwd)"
export APP_HOME
cd "$APP_HOME"
STATE_DIR="$SCRIPT_DIR/.state"
LOG_DIR="$STATE_DIR/logs"
mkdir -p "$LOG_DIR"

DB_PID_FILE="$STATE_DIR/db.docker"
API_PID_FILE="$STATE_DIR/api.pid"
WEB_PID_FILE="$STATE_DIR/web.pid"
API_PORT_FILE="$STATE_DIR/api.port"
WEB_PORT_FILE="$STATE_DIR/web.port"
API_LOG_OUT="$LOG_DIR/api.out.log"
API_LOG_ERR="$LOG_DIR/api.err.log"
WEB_LOG_OUT="$LOG_DIR/web.out.log"
WEB_LOG_ERR="$LOG_DIR/web.err.log"

info(){ echo -e "\e[36m[start]\e[0m $*"; }
warn(){ echo -e "\e[33m[warn]\e[0m $*"; }

load_env(){
  local file="$1"
  [[ -f "$file" ]] || return 0
  info "Loading env $file"
  while IFS='=' read -r k v; do
    [[ -z "$k" || "$k" =~ ^# ]] && continue
    export "$k"="${v%$'\r'}"
  done < "$file"
}

port_free(){
  local p=$1
  if command -v lsof >/dev/null 2>&1; then
    ! lsof -iTCP:"$p" -sTCP:LISTEN -P -n >/dev/null 2>&1
  else
    # ss fallback
    ! ss -ltn 2>/dev/null | awk '{print $4}' | grep -E "[:.]$p$" >/dev/null 2>&1
  fi
}
next_free_port(){
  local start=$1
  local p=$start
  while ! port_free "$p"; do p=$((p+1)); done
  echo "$p"
}

API_PORT="$(next_free_port "$API_PORT")"
WEB_PORT="$(next_free_port "$WEB_PORT")"

load_env "$ENV_FILE"

# 1. DB via docker compose
if [[ $NO_DB -eq 0 ]]; then
  info "Ensuring compose services (db, redis, others) are up"
  if [[ $REBUILD -eq 1 ]]; then
    docker compose up -d --build
  else
    docker compose up -d
  fi
  date -u +%FT%TZ > "$DB_PID_FILE"
fi

# 2. API
if [[ $NO_API -eq 0 ]]; then
  if [[ -f "$API_PID_FILE" ]]; then
    old=$(cat "$API_PID_FILE") || true
    if [[ -n "$old" && -d "/proc/$old" ]]; then
      warn "API already running (PID $old)"
    else
      rm -f "$API_PID_FILE"
    fi
  fi
  if [[ ! -f "$API_PID_FILE" ]]; then
    info "Starting API on :$API_PORT"
    API_DIR="$APP_HOME/services/api"
    if [[ $NO_MIGRATE -eq 0 && -f "$API_DIR/alembic.ini" ]]; then
      (cd "$API_DIR" && info "Applying migrations" && python -m alembic upgrade head || warn "Migration failed")
    fi
    (cd "$API_DIR" && nohup python -m uvicorn app.main:app --reload --port "$API_PORT" >"$API_LOG_OUT" 2>"$API_LOG_ERR" & echo $! > "$API_PID_FILE")
    echo "$API_PORT" > "$API_PORT_FILE"
  fi
fi

# 3. Web
if [[ $NO_WEB -eq 0 ]]; then
  if [[ -f "$WEB_PID_FILE" ]]; then
    old=$(cat "$WEB_PID_FILE") || true
    if [[ -n "$old" && -d "/proc/$old" ]]; then
      warn "Web already running (PID $old)"
    else
      rm -f "$WEB_PID_FILE"
    fi
  fi
  if [[ ! -f "$WEB_PID_FILE" ]]; then
    info "Starting Web on :$WEB_PORT"
    WEB_DIR="$APP_HOME/apps/web"
    if [[ ! -d "$WEB_DIR/node_modules" ]]; then
      info "Installing frontend dependencies"; (cd "$WEB_DIR" && npm install)
    fi
    (cd "$WEB_DIR" && nohup npm run dev -- --port "$WEB_PORT" >"$WEB_LOG_OUT" 2>"$WEB_LOG_ERR" & echo $! > "$WEB_PID_FILE")
    sleep 0.6
    if [[ ! -d "/proc/$(cat "$WEB_PID_FILE" 2>/dev/null || echo 0)" ]]; then
      if port_free "$WEB_PORT"; then
        warn "Web process exited early; check web.err.log"
      else
        warn "Web PID not found but port open (marking)"; echo 0 > "$WEB_PID_FILE"
      fi
    fi
    echo "$WEB_PORT" > "$WEB_PORT_FILE"
  fi
fi

info "API => http://localhost:$API_PORT"
[[ $NO_WEB -eq 0 ]] && info "Web => http://localhost:$WEB_PORT"

if [[ $OPEN_BROWSER -eq 1 && $NO_WEB -eq 0 ]]; then
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "http://localhost:$WEB_PORT" >/dev/null 2>&1 & fi
fi

if [[ $ATTACH -eq 1 ]]; then
  info "Tailing logs (Ctrl+C to detach)"
  tail -n 20 -f "$API_LOG_OUT" "$API_LOG_ERR" $( [[ $NO_WEB -eq 0 ]] && echo "$WEB_LOG_OUT" "$WEB_LOG_ERR" )
fi
