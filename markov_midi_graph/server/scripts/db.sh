#!/usr/bin/env bash
# Manual control of the local PostgreSQL 18 development cluster.
# It only ever targets the one data directory below and never registers
# anything to start at login (no brew services, no launchd).
#
#   ./scripts/db.sh start | stop | status | psql | psql-app
set -uo pipefail

PG_BIN="/opt/homebrew/opt/postgresql@18/bin"
PGDATA_DIR="/opt/homebrew/var/postgresql@18"
LOG_FILE="/opt/homebrew/var/log/postgresql@18.log"
DB_NAME="markov_midi_graph_dev"
SERVER_DIR="$(cd "$(dirname "$0")/.." && pwd)"

export LC_ALL="en_US.UTF-8"

case "${1:-}" in
  start)
    # -w waits until the server accepts connections; output goes to LOG_FILE.
    "$PG_BIN/pg_ctl" -D "$PGDATA_DIR" -l "$LOG_FILE" -w start
    ;;
  stop)
    # "fast" = roll back open transactions, disconnect clients, checkpoint,
    # then exit cleanly. -w waits until shutdown has finished.
    "$PG_BIN/pg_ctl" -D "$PGDATA_DIR" -m fast -w stop
    ;;
  status)
    "$PG_BIN/pg_ctl" -D "$PGDATA_DIR" status
    code=$?
    "$PG_BIN/pg_isready" -h localhost -p 5432
    exit $code
    ;;
  psql)
    # Superuser (your macOS user) over the Unix socket, authenticated by "peer".
    shift
    exec "$PG_BIN/psql" -d "$DB_NAME" "$@"
    ;;
  psql-app)
    # The application role over TCP, using the same PG* variables as the backend.
    shift
    if [[ ! -f "$SERVER_DIR/.env" ]]; then
      echo "Missing $SERVER_DIR/.env (copy .env.example and fill it in)." >&2
      exit 1
    fi
    set -a; source "$SERVER_DIR/.env"; set +a
    exec "$PG_BIN/psql" "$@"
    ;;
  *)
    echo "usage: $0 start|stop|status|psql|psql-app" >&2
    exit 2
    ;;
esac
