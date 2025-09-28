#!/usr/bin/env bash
set -euo pipefail
# Stop API / Web / DB similar to stop-all.ps1
# Flags:
#   --db  : stop only db (docker compose down if tracked)
#   --api : stop only api
#   --web : stop only web
#   --all : stop all (default if none)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_HOME="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_DIR="$SCRIPT_DIR/.state"
DB_PID_FILE="$STATE_DIR/db.docker"
API_PID_FILE="$STATE_DIR/api.pid"
WEB_PID_FILE="$STATE_DIR/web.pid"
API_PORT_FILE="$STATE_DIR/api.port"
WEB_PORT_FILE="$STATE_DIR/web.port"

ONLY_DB=0; ONLY_API=0; ONLY_WEB=0; ALL=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --db) ONLY_DB=1; shift ;;
    --api) ONLY_API=1; shift ;;
    --web) ONLY_WEB=1; shift ;;
    --all) ALL=1; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# //'; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done
if [[ $ONLY_DB -eq 0 && $ONLY_API -eq 0 && $ONLY_WEB -eq 0 && $ALL -eq 0 ]]; then ALL=1; fi

info(){ echo -e "\e[33m[stop]\e[0m $*"; }

stop_pid(){
  local pid_file="$1" label="$2" port_file="$3"
  if [[ -f "$pid_file" ]]; then
    pid=$(cat "$pid_file" || true)
    if [[ -n "${pid}" && "$pid" != 0 && -d "/proc/$pid" ]]; then
      info "Stopping $label ($pid)"; kill "$pid" 2>/dev/null || true
      sleep 0.2
      if [[ -d "/proc/$pid" ]]; then kill -9 "$pid" 2>/dev/null || true; fi
    fi
    rm -f "$pid_file" "$port_file"
  fi
}

if [[ $ALL -eq 1 || $ONLY_API -eq 1 ]]; then
  stop_pid "$API_PID_FILE" api "$API_PORT_FILE"
fi
if [[ $ALL -eq 1 || $ONLY_WEB -eq 1 ]]; then
  stop_pid "$WEB_PID_FILE" web "$WEB_PORT_FILE"
fi
if [[ $ALL -eq 1 || $ONLY_DB -eq 1 ]]; then
  if [[ -f "$DB_PID_FILE" ]]; then
    info "Stopping docker compose services"
    (cd "$APP_HOME" && docker compose down >/dev/null 2>&1 || true)
    rm -f "$DB_PID_FILE"
  fi
fi
info "Done."