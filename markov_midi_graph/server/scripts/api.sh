#!/usr/bin/env bash
# Check or stop THIS project's backend API. Normally you stop it with Ctrl-C
# in the terminal running `npm run dev`; `stop` is for when that terminal is lost.
#
# How it finds the API: the server writes its PID (and its parent's) to
# server/.api.pid when it starts listening. If that record is missing, the
# process listening on $PORT is considered instead.
#
# Before signaling anything, every candidate PID must pass ALL of:
#   1. it is still running
#   2. it belongs to your Mac account
#   3. its command is `node ... src/index.ts`
#   4. its working directory is exactly this server/ folder
# Check 4 is what keeps other projects (even with an identical command line)
# safe. A record that fails the checks is stale: it is deleted, never signaled.
# Nothing is ever force-killed (no SIGKILL).
#
#   ./scripts/api.sh status | stop
set -uo pipefail

SERVER_DIR="$(cd "$(dirname "$0")/.." && pwd -P)"
PID_FILE="$SERVER_DIR/.api.pid"
PORT="$(grep -E '^PORT=' "$SERVER_DIR/.env" 2>/dev/null | cut -d= -f2)"
PORT="${PORT:-4000}"
NODE_RE='(^|/)node[[:space:]]'

# is_this_backend PID: succeeds only if PID passes checks 1-4 above.
is_this_backend() {
  local pid="$1" uid="" cmd="" cwd=""
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  uid="$(ps -o uid= -p "$pid" 2>/dev/null | tr -d ' ')"
  [[ -n "$uid" && "$uid" == "$(id -u)" ]] || return 1
  cmd="$(ps -o command= -p "$pid" 2>/dev/null)"
  [[ "$cmd" =~ $NODE_RE && "$cmd" == *"src/index.ts"* ]] || return 1
  cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')"
  [[ "$cwd" == "$SERVER_DIR" ]]
}

# Sets SERVER_PID and WATCHER_PID (empty when not found). Removes a stale record.
find_backend() {
  SERVER_PID=""
  WATCHER_PID=""
  local rec_pid="" rec_ppid="" listener="" ppid=""

  if [[ -f "$PID_FILE" ]]; then
    { read -r rec_pid; read -r rec_ppid; } <"$PID_FILE"
    is_this_backend "$rec_pid" && SERVER_PID="$rec_pid"
    is_this_backend "$rec_ppid" && WATCHER_PID="$rec_ppid"
    if [[ -z "$SERVER_PID" && -z "$WATCHER_PID" ]]; then
      echo "api: removed stale record $PID_FILE (pid ${rec_pid:-?} is not this backend; nothing was signaled)"
      rm -f "$PID_FILE"
    fi
  fi

  if [[ -z "$SERVER_PID" ]]; then
    listener="$(lsof -nP -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | head -1)"
    is_this_backend "$listener" && SERVER_PID="$listener"
  fi

  if [[ -n "$SERVER_PID" && -z "$WATCHER_PID" ]]; then
    ppid="$(ps -o ppid= -p "$SERVER_PID" 2>/dev/null | tr -d ' ')"
    is_this_backend "$ppid" && WATCHER_PID="$ppid"
  fi
}

any_alive() {
  local p
  for p in "$@"; do
    [[ -n "$p" ]] && kill -0 "$p" 2>/dev/null && return 0
  done
  return 1
}

case "${1:-}" in
  status)
    find_backend
    if [[ -z "$SERVER_PID" && -z "$WATCHER_PID" ]]; then
      other="$(lsof -nP -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | head -1)"
      if [[ -n "$other" ]]; then
        echo "api: stopped, but port $PORT is in use by another program (pid $other, not this backend):"
        echo "     $(ps -o command= -p "$other" 2>/dev/null | cut -c1-100)"
      else
        echo "api: stopped (nothing listening on port $PORT)"
      fi
      exit 3
    fi
    echo "api: running (server pid ${SERVER_PID:-none}${WATCHER_PID:+, watcher pid $WATCHER_PID}) in $SERVER_DIR"
    if [[ -n "$SERVER_PID" ]]; then
      curl -sS --max-time 5 "http://127.0.0.1:$PORT/api/health"
      echo
    fi
    ;;
  stop)
    find_backend
    if [[ -z "$SERVER_PID" && -z "$WATCHER_PID" ]]; then
      echo "api: not running (nothing to stop)"
      exit 0
    fi
    # Under `npm run dev`, signal the watcher: it stops its server child
    # (which shuts down gracefully) and then exits itself.
    target="${WATCHER_PID:-$SERVER_PID}"
    kill -TERM "$target"
    echo "api: sent SIGTERM to pid $target"
    for _ in $(seq 1 50); do
      any_alive "$SERVER_PID" "$WATCHER_PID" || break
      sleep 0.2
    done
    if any_alive "$SERVER_PID" "$WATCHER_PID"; then
      echo "api: still running after 10s (pids: $SERVER_PID $WATCHER_PID); not force-killing." >&2
      echo "     Check the terminal running it, or inspect with: ps -o pid,command -p <pid>" >&2
      exit 1
    fi
    # The server deletes its own record on a clean exit; tidy up if it couldn't.
    rm -f "$PID_FILE"
    echo "api: stopped"
    ;;
  *)
    echo "usage: $0 status|stop" >&2
    exit 2
    ;;
esac
