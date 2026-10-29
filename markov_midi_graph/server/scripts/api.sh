#!/usr/bin/env bash
# Check or stop the backend API. Normally you stop it with Ctrl-C in the
# terminal running `npm run dev`; `stop` is for when that terminal is lost.
#
#   ./scripts/api.sh status | stop
set -uo pipefail

SERVER_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="$(grep -E '^PORT=' "$SERVER_DIR/.env" 2>/dev/null | cut -d= -f2)"
PORT="${PORT:-4000}"
# Matches only the node command used by `npm run dev` / `npm start`.
PATTERN='env-file-if-exists=.env src/index.ts'

case "${1:-}" in
  status)
    pid="$(lsof -nP -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null)"
    if [[ -z "$pid" ]]; then
      echo "api: nothing listening on port $PORT (stopped)"
      exit 3
    fi
    echo "api: listening on port $PORT (pid $pid)"
    curl -sS "http://127.0.0.1:$PORT/api/health"; echo
    ;;
  stop)
    if pkill -TERM -f -- "$PATTERN"; then
      echo "api: sent SIGTERM to backend processes"
    else
      echo "api: no backend process found"
    fi
    ;;
  *)
    echo "usage: $0 status|stop" >&2
    exit 2
    ;;
esac
