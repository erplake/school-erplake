#!/usr/bin/env bash
set -euo pipefail
# Tail or show logs for api/web
# Flags:
#   --target api|web|all  (default all)
#   --follow              (tail -f)
#   --lines N             (default 40)

TARGET=all
FOLLOW=0
LINES=40
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --follow) FOLLOW=1; shift ;;
    --lines) LINES="$2"; shift 2 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# //'; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/.state/logs"

API_OUT="$LOG_DIR/api.out.log"
API_ERR="$LOG_DIR/api.err.log"
WEB_OUT="$LOG_DIR/web.out.log"
WEB_ERR="$LOG_DIR/web.err.log"

sel=()
if [[ "$TARGET" == "api" || "$TARGET" == "all" ]]; then
  [[ -f "$API_OUT" ]] && sel+=("$API_OUT")
  [[ -f "$API_ERR" ]] && sel+=("$API_ERR")
fi
if [[ "$TARGET" == "web" || "$TARGET" == "all" ]]; then
  [[ -f "$WEB_OUT" ]] && sel+=("$WEB_OUT")
  [[ -f "$WEB_ERR" ]] && sel+=("$WEB_ERR")
fi

if [[ ${#sel[@]} -eq 0 ]]; then
  echo "No logs found for target $TARGET"; exit 0
fi

if [[ $FOLLOW -eq 1 ]]; then
  tail -n "$LINES" -f "${sel[@]}"
else
  for f in "${sel[@]}"; do
    echo "===== $f (last $LINES) ====="
    tail -n "$LINES" "$f" || true
    echo
  done
fi
