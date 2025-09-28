#!/usr/bin/env bash
set -euo pipefail
# Show status similar to status.ps1
# Outputs RUNNING/stopped for db/api/web, health timings, docker ps summary

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_HOME="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_DIR="$SCRIPT_DIR/.state"
DB_PID_FILE="$STATE_DIR/db.docker"
API_PID_FILE="$STATE_DIR/api.pid"
WEB_PID_FILE="$STATE_DIR/web.pid"
API_PORT_FILE="$STATE_DIR/api.port"
WEB_PORT_FILE="$STATE_DIR/web.port"

api_port=8000
web_port=5173
[[ -f "$API_PORT_FILE" ]] && api_port=$(cat "$API_PORT_FILE")
[[ -f "$WEB_PORT_FILE" ]] && web_port=$(cat "$WEB_PORT_FILE")

color_green='\e[32m'; color_gray='\e[90m'; color_cyan='\e[36m'; color_reset='\e[0m'

port_open(){
  local p=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$p" -sTCP:LISTEN -P -n >/dev/null 2>&1
  else
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -E "[:.]$p$" >/dev/null 2>&1
  fi
}

row(){
  local svc=$1 pid_file=$2 default_port=$3
  if [[ -f "$pid_file" ]]; then
    pid=$(cat "$pid_file" || true)
    if [[ -n "$pid" && "$pid" != 0 && -d "/proc/$pid" ]]; then
      printf "%s%-5s : RUNNING (pid %s)%s\n" "$color_green" "$svc" "$pid" "$color_reset"; return
    fi
    if port_open "$default_port"; then
      printf "%s%-5s : RUNNING port-open%s\n" "$color_green" "$svc" "$color_reset"; return
    fi
    printf "%s%-5s : stopped%s\n" "$color_gray" "$svc" "$color_reset"; return
  else
    if [[ "$svc" == 'api' || "$svc" == 'web' ]]; then
      if port_open "$default_port"; then
        printf "%s%-5s : RUNNING port-open%s\n" "$color_green" "$svc" "$color_reset"; return
      fi
    fi
    printf "%s%-5s : stopped%s\n" "$color_gray" "$svc" "$color_reset"
  fi
}

row db "$DB_PID_FILE" 0
row api "$API_PID_FILE" "$api_port"
row web "$WEB_PID_FILE" "$web_port"

# Health checks
curl_health(){
  local name=$1 url=$2
  if command -v curl >/dev/null 2>&1; then
    if port_open "${url##*:}"; then
      local start end ms
      start=$(date +%s%3N 2>/dev/null || date +%s000)
      code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$url" || true)
      end=$(date +%s%3N 2>/dev/null || date +%s000)
      ms=$((end-start))
      if [[ "$code" == "200" ]]; then
        printf "%s%s health: %dms%s\n" "$color_cyan" "$name" "$ms" "$color_reset"
      fi
    fi
  fi
}

curl_health api "http://localhost:$api_port/healthz"
curl_health web "http://localhost:$web_port/"

printf "%s--- docker compose services ---%s\n" "$color_cyan" "$color_reset"
(docker ps --format 'table {{.Names}}\t{{.Status}}' || echo 'docker not available') | sed '1!b; t; s/.*/NAME\tSTATUS/'

# local postgres probe: attempt common ports 5544 5432
printf "%s--- local postgres probe ---%s\n" "$color_cyan" "$color_reset"
for p in 5544 5432; do
  if port_open "$p"; then
    printf "%sport %s: open%s\n" "$color_green" "$p" "$color_reset"
  else
    printf "%sport %s: no-response%s\n" "$color_gray" "$p" "$color_reset"
  fi
done
