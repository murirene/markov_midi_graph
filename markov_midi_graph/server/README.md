# Local development backend (`server/`)

The backend for the `markov_midi_graph` React app: an **Express** API with a
REST health check and an **Apollo Server** GraphQL endpoint, both talking to a
local **PostgreSQL 18** database through the **pg** driver.

Everything here starts **only when you run a command** and stops when you stop
it. Nothing starts at login or reboot.

Set up and verified on 2026-10-28 on macOS (Apple Silicon, Homebrew in
`/opt/homebrew`). Project root:
`/Users/renemurillo/Desktop/awaiting_projects_CSE/gray-area-algorithmic-music-composition/markov_midi_graph`

---

## Which instructions do I need?

| Situation | Go to |
|-----------|-------|
| This Mac already has the setup (`/opt/homebrew/var/postgresql@18` exists and `server/.env` exists) and you just want to work | [Everyday start (existing setup)](#everyday-start-existing-setup) |
| New Mac, fresh clone, or PostgreSQL / `server/.env` missing | [Fresh-machine setup (one time)](#fresh-machine-setup-one-time), then the everyday start |

Not sure? From `server/`, run
`ls /opt/homebrew/var/postgresql@18/PG_VERSION .env`. If both files are
listed, it's an existing setup.

## Everyday start (existing setup)

| # | Directory | Command | What it does |
|---|-----------|---------|--------------|
| 1 | `server/` | `nvm use` | Switch to Node 24 (reads `server/.nvmrc`) |
| 2 | `server/` | `npm install` | Only after pulling a dependency change; otherwise skip |
| 3 | `server/` | `npm run db:start` | Start PostgreSQL |
| 4 | `server/` | `npm run dev` | Start the API (keeps this terminal busy; auto-restarts on file save) |
| 5 | `server/` (2nd terminal) | `npm run status` | Confirm DB and API are both up |
| 6 | project root (3rd terminal, optional) | `npm run dev` | Start the React app (Vite, http://localhost:5173) |

### Shut down when you finish (reverse order)

| # | Where | Action |
|---|-------|--------|
| 1 | React terminal | `Ctrl-C` |
| 2 | API terminal | `Ctrl-C` (or from anywhere in `server/`: `npm run api:stop`) |
| 3 | `server/` | `npm run db:stop` |
| 4 | `server/` | `npm run status`: expect `pg_ctl: no server running` and `api: stopped (nothing listening on port 4000)` |

---

## Fresh-machine setup (one time)

This recreates the setup described in this file on a Mac that doesn't have
it. Every step **checks first** and refuses to overwrite an existing cluster,
role, database, or `.env`, so it's safe to re-run step by step if something
fails halfway. Nothing here registers anything to start at login.

Assumptions: Apple Silicon Mac with Homebrew in `/opt/homebrew` (on an Intel
Mac, Homebrew uses `/usr/local`, and the paths in `server/scripts/db.sh`
would need editing). You're logged in as the Mac account that should own and
run the database. **Don't use `sudo`** for any step.

### 1. Homebrew

```bash
brew --version          # if "command not found", install from https://brew.sh
```

### 2. Node.js 24 via nvm

```bash
command -v nvm || echo "nvm missing"
```

If nvm is missing, install it with the official instructions at
https://github.com/nvm-sh/nvm#installing-and-updating. Its installer adds
these lines to `~/.zshrc` (that's the only shell change; open a new terminal
afterwards):

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

Then:

```bash
nvm install 24          # latest Node 24 LTS; harmless if already installed
nvm alias default 24    # optional: make it the default in new terminals
node -v                 # expect v24.x
```

### 3. Get the code

The GitHub repository has the app one folder down:

```bash
git clone https://github.com/murirene/markov_midi_graph.git
cd markov_midi_graph/markov_midi_graph      # the project root (React app)
```

All later steps say whether to run from the **project root** or from
**`server/`** (`cd server` from the project root).

### 4. PostgreSQL 18: install and check the cluster

First look at what already exists:

```bash
brew list --versions postgresql@18                    # installed already?
ls /opt/homebrew/var/postgresql@18/PG_VERSION         # cluster already initialized?
lsof -nP -iTCP:5432 -sTCP:LISTEN                      # another PostgreSQL already using port 5432?
```

- If port 5432 is taken by another PostgreSQL (e.g. Postgres.app), stop that
  one first, or plan to change the port (see Troubleshooting).
- Install if needed (this does **not** start it or register a service):

  ```bash
  brew install postgresql@18
  ```

  Homebrew's install creates the cluster (data directory)
  `/opt/homebrew/var/postgresql@18` automatically, **but only if it doesn't
  already exist**. Existing data is never replaced.

- Only if `PG_VERSION` is **still** missing after the install (for example,
  the folder was deleted), initialize it yourself. `initdb` refuses to run on
  a non-empty directory, so it can't overwrite anything:

  ```bash
  /opt/homebrew/opt/postgresql@18/bin/initdb --locale=en_US.UTF-8 -E UTF-8 -D /opt/homebrew/var/postgresql@18
  ```

  Either way, the PostgreSQL superuser role is named after your Mac account
  and has no password.

**Never run `brew services start postgresql@18`**: that would make it start
at login.

### 5. Local authentication and localhost-only listening

Homebrew's default `pg_hba.conf` trusts every local connection without a
password. Replace it with the rules this project uses (see
[Who can log in](#who-can-log-in-and-how-opthomebrewvarpostgresql18pg_hbaconf)).
The block below skips itself if it was already applied, and keeps Homebrew's
original as `pg_hba.conf.homebrew-default`. If this cluster existed before
and you've customized `pg_hba.conf` yourself, review it by hand instead.

```bash
D=/opt/homebrew/var/postgresql@18
if grep -q 'markov_midi_graph local dev overrides' "$D/postgresql.conf"; then
  echo "already configured; nothing changed"
else
  cp -n "$D/pg_hba.conf" "$D/pg_hba.conf.homebrew-default"
  cat > "$D/pg_hba.conf" <<'EOF'
# Local development cluster for markov_midi_graph (edited from Homebrew default;
# original saved as pg_hba.conf.homebrew-default).
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Unix socket: only the matching macOS user (the superuser named after it) gets in.
local   all             all                                     peer

# TCP from this computer only: password (SCRAM) required. Used by the backend app.
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256

local   replication     all                                     peer
EOF
  cat >> "$D/postgresql.conf" <<'EOF'

# --- markov_midi_graph local dev overrides ---
listen_addresses = 'localhost'   # never accept connections from other machines
port = 5432
EOF
  echo "configured"
fi
```

### 6. Start PostgreSQL (from `server/`)

```bash
npm run db:start        # "server started"
npm run db:status       # "server is running" + "accepting connections"
```

(If it was already running before step 5, apply the new rules with
`npm run db:stop && npm run db:start`.)

### 7. Create the restricted app role and the database (from `server/`)

Check first. Empty output means it doesn't exist yet:

```bash
/opt/homebrew/opt/postgresql@18/bin/psql -d postgres -Atc "select rolname from pg_roles where rolname = 'markov_app'"
/opt/homebrew/opt/postgresql@18/bin/psql -d postgres -Atc "select datname from pg_database where datname = 'markov_midi_graph_dev'"
```

Create whichever is missing. If either already exists, PostgreSQL stops
with `already exists` and changes nothing:

```bash
/opt/homebrew/opt/postgresql@18/bin/psql -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE ROLE markov_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION"
/opt/homebrew/opt/postgresql@18/bin/psql -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE markov_midi_graph_dev OWNER markov_app ENCODING 'UTF8'"
```

These connect as the superuser over the Unix socket (peer authentication, no
password). The role has no password yet; step 8 sets it.

### 8. Private environment file + app password (from `server/`)

This block creates `server/.env` (mode `600`, git-ignored) from
`.env.example`, generates a random password, and sets the same password on
the role. The password is never printed, never typed into your shell
history, and never passed as a command-line argument (it's sent to `psql` on
standard input). It refuses to run if `.env` already exists:

```bash
(
  set -e
  umask 077
  [[ ! -e .env ]] || { echo ".env already exists; not overwriting"; exit 1; }
  PW="$(openssl rand -hex 24)"
  { grep -v '^PGPASSWORD=' .env.example; echo "PGPASSWORD=$PW"; } > .env
  printf "ALTER ROLE markov_app PASSWORD '%s';\n" "$PW" |
    /opt/homebrew/opt/postgresql@18/bin/psql -d postgres -q -v ON_ERROR_STOP=1
  echo "created .env and set the markov_app password"
)
ls -l .env              # expect -rw-------
```

If `.env` already exists but you don't know whether its password matches the
role, test it with `npm run db:psql-app -- -c 'select 1'`. If that fails, reset
the password (see
[Lost or need a new password?](#lost-or-need-a-new-password-reset-it-as-superuser)).

### 9. Install dependencies

```bash
# from server/: backend packages, exactly as pinned in server/package-lock.json
npm ci
# from the project root (cd ..): the React app's packages
npm ci
```

### 10. Verify (from `server/`)

```bash
npm run typecheck                                              # no output = OK
npm run db:psql-app -- -Atc 'select current_user, current_database()'
#   expect: markov_app|markov_midi_graph_dev
npm run dev                                                    # terminal 1, leave running
```

In a second terminal, also from `server/`:

```bash
npm run status
#   expect: "server is running", "accepting connections",
#           "api: running (server pid …, watcher pid …)" and {"status":"ok",…}
curl -s -X POST http://127.0.0.1:4000/graphql -H 'content-type: application/json' \
  -d '{"query":"{ health { status database { ok role } } }"}'
#   expect: {"data":{"health":{"status":"ok","database":{"ok":true,"role":"markov_app"}}}}
brew services info postgresql@18
#   expect: Running: false, Loaded: false. brew only tracks services it launched itself,
#   so a hand-started server shows "false" too: that means no login item was registered
```

Then shut everything down as described in
[Shut down when you finish](#shut-down-when-you-finish-reverse-order). Setup
is complete; from now on use the [Everyday start](#everyday-start-existing-setup).

---

## What is installed, why, and where

| Component | Version | Purpose | Location |
|-----------|---------|---------|----------|
| Node.js (via nvm) | 24.14.1 (LTS line "Krypton") | Runs the backend TypeScript directly | `~/.nvm/versions/node/v24.14.1/bin/node` |
| npm | 11.11.0 | Installs packages | ships with Node above |
| PostgreSQL (Homebrew `postgresql@18`) | 18.6 | The database server | binaries: `/opt/homebrew/opt/postgresql@18/bin` (→ `/opt/homebrew/Cellar/postgresql@18/18.6_1`) |
| PostgreSQL data directory ("cluster") | n/a | All databases, roles, and config files | `/opt/homebrew/var/postgresql@18` |
| PostgreSQL log | n/a | Server output when started via `db:start` | `/opt/homebrew/var/log/postgresql@18.log` |
| express | 5.3.0 | HTTP server and routing | `server/node_modules` |
| @apollo/server | 5.5.1 | GraphQL server | `server/node_modules` |
| @as-integrations/express5 | 1.1.2 | Mounts Apollo inside Express 5 (Apollo 5 no longer bundles this) | `server/node_modules` |
| graphql | 16.14.2 | GraphQL engine. **Must stay 16.x**: Apollo Server 5 requires `^16.11`; v17 is not compatible yet | `server/node_modules` |
| pg | 8.23.1 | PostgreSQL driver (node-postgres) | `server/node_modules` |
| typescript | 6.0.3 | Type-checking only (`npm run typecheck`), same major as the React app | `server/node_modules` |

All backend packages are local to `server/`. Nothing was installed globally.
The React app's `package.json`/`node_modules` at the project root are separate
and untouched.

Notes:

- **Why no `tsx`/`ts-node`/build step?** Node 24 runs `.ts` files natively by
  stripping the types. That is why imports end in `.ts` and `server/tsconfig.json`
  sets `allowImportingTsExtensions`, `verbatimModuleSyntax`, and
  `erasableSyntaxOnly` (no `enum`, no `namespace`, no constructor parameter
  properties). `tsc` only checks types; it never writes JavaScript.
- **Node updates:** v24 is supported until April 2028. Newer 24.x patch
  releases exist; to update without losing global packages:
  `nvm install 24 --reinstall-packages-from=24.14.1 && nvm alias default 24`.
- **PostgreSQL is "keg-only"**: Homebrew did not put `psql`/`pg_ctl` on your
  PATH, and **no shell config was changed**. The `npm run db:*` scripts use full
  paths. If you want bare `psql` in your terminal, add this line to `~/.zshrc`
  (optional):
  `export PATH="/opt/homebrew/opt/postgresql@18/bin:$PATH"`
- Homebrew upgrades (`brew upgrade`) can move `postgresql@18` to a newer 18.x
  patch. That's safe; the data directory stays the same. A major version (19)
  would be a separate formula plus a data migration.

---

## How the pieces connect

```
 Browser
   │
   ▼
 React app (Vite dev server, :5173)        ← project root: src/
   │   fetch('/api/...') or a GraphQL POST   (not wired up yet; your exercise)
   ▼
 Node.js process running Express (:4000)    ← server/src/index.ts
   ├── /api/*     REST routes               ← server/src/routes/
   └── /graphql   Apollo Server             ← server/src/graphql/
           │  both call the same functions
           ▼
       server/src/db/   (pg Pool → SQL)
           │  TCP 127.0.0.1/::1 :5432, password auth
           ▼
 PostgreSQL 18 server  → database markov_midi_graph_dev
```

- **React** is the UI. Vite serves it in development and it runs in the browser.
- **Node.js** is the JavaScript runtime that runs the backend outside the browser.
- **Express** is the web framework inside Node. It receives HTTP requests and
  routes them to handler functions (REST).
- **Apollo Server** is a GraphQL server mounted *inside the same Express app* at
  `/graphql`. Clients send one query describing the exact data they want; Apollo
  calls your *resolver* functions to fill it.
- **PostgreSQL** is the database server, a separate process that stores data on
  disk. The backend talks to it through **pg**'s connection pool.

REST and GraphQL are two doors into the same backend. Both doors call the same
database functions in `server/src/db/`, so data logic is written once.

---

## Commands reference

All run from **`server/`**.

| Component | Start | Stop | Status |
|-----------|-------|------|--------|
| PostgreSQL | `npm run db:start` | `npm run db:stop` | `npm run db:status` |
| API (dev, auto-reload) | `npm run dev` | `Ctrl-C`, or `npm run api:stop` | `npm run api:status` |
| API (no auto-reload) | `npm start` | `Ctrl-C`, or `npm run api:stop` | `npm run api:status` |
| Both | n/a | n/a | `npm run status` |

Other: `npm run typecheck`, `npm run db:psql`, `npm run db:psql-app`.

**Order matters:** start the database before the API, and stop the API before
the database. (If the DB stops first, the API keeps running and reports
`degraded`. It does not crash, and it recovers when the DB comes back.)

What these do under the hood (`server/scripts/db.sh`, `server/scripts/api.sh`):

```bash
# start: run in the background, log to file, wait until ready
/opt/homebrew/opt/postgresql@18/bin/pg_ctl -D /opt/homebrew/var/postgresql@18 -l /opt/homebrew/var/log/postgresql@18.log -w start
# stop: "fast" = roll back open transactions, disconnect clients, checkpoint, exit cleanly
/opt/homebrew/opt/postgresql@18/bin/pg_ctl -D /opt/homebrew/var/postgresql@18 -m fast -w stop
# status
/opt/homebrew/opt/postgresql@18/bin/pg_ctl -D /opt/homebrew/var/postgresql@18 status
/opt/homebrew/opt/postgresql@18/bin/pg_isready -h localhost -p 5432
```

`-D <data dir>` is what makes these commands target **only this cluster**.
Other PostgreSQL installs, if any, are never touched.

**How `api:status` / `api:stop` find the API, and why they can't hit
another project.** When the server starts listening it writes
`server/.api.pid`. Line 1 is its own PID. Line 2 is its parent's PID, which is
the `node --watch` process under `npm run dev`. On a clean exit it deletes the
file. If the file is missing, the process listening on `PORT` is considered
instead. Before anything is signaled, each candidate PID must pass **all**
of these checks:

1. it is still running;
2. it belongs to your Mac account;
3. its command is `node … src/index.ts`;
4. its **working directory is exactly this `server/` folder** (checked with
   `lsof`).

Check 4 is what protects other projects, even ones running an identical
command line. A record that fails any check is **stale** (for example, left
behind by a crash, with the PID since reused by an unrelated program). It's
deleted with a message saying nothing was signaled. `api:stop` sends SIGTERM
once (to the watcher under `npm run dev`, which stops its server child), waits
up to 10 s, and **never force-kills**. If something is still running, it tells
you and stops. The API handles SIGINT/SIGTERM by finishing in-flight
requests, closing the DB pool, deleting `.api.pid`, and exiting with code 0.

**Supporting processes:** PostgreSQL runs as several processes (one
`postgres` main process plus background workers like the checkpointer and WAL
writer, and one process per client connection). That's normal; `db:stop` ends
all of them. `npm run dev` runs two Node processes (a file watcher plus the
server); `Ctrl-C` ends both. There's no other daemon, process manager, or
helper.

---

## Ports and endpoints

| What | Address | Reachable from |
|------|---------|----------------|
| REST health check | `GET http://127.0.0.1:4000/api/health` | this Mac only (bound to 127.0.0.1) |
| GraphQL | `POST http://127.0.0.1:4000/graphql` | this Mac only |
| GraphQL explorer (Apollo Sandbox) | open `http://127.0.0.1:4000/graphql` in a browser | this Mac only (loads Sandbox UI from Apollo's CDN, needs internet) |
| PostgreSQL | `localhost:5432` (TCP on 127.0.0.1 and ::1) + Unix socket `/tmp/.s.PGSQL.5432` | this Mac only (`listen_addresses = 'localhost'`) |
| React (Vite) | `http://localhost:5173` | started separately from project root |

### Testing

```bash
# REST: expect HTTP 200 and "status":"ok" (503 + "degraded" if the DB is down)
curl -i http://127.0.0.1:4000/api/health

# GraphQL
curl -s -X POST http://127.0.0.1:4000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ health { status database { ok database role serverTime error } } }"}'

# Database, as the app role (same credentials the API uses)
npm run db:psql-app -- -c 'select current_user, current_database(), version()'
```

Verified responses (2026-10-28):

```json
{"status":"ok","database":{"ok":true,"database":"markov_midi_graph_dev","role":"markov_app","serverTime":"…","error":null}}
{"data":{"health":{"status":"ok","database":{"ok":true,"database":"markov_midi_graph_dev","role":"markov_app","serverTime":"…"}}}}
```

---

## The development database

| Item | Value |
|------|-------|
| Database | `markov_midi_graph_dev` (UTF8), owned by `markov_app`, no tables yet |
| Other databases | `postgres`, `template0`, `template1` (built-in, owned by `renemurillo`; leave them alone) |

## Accounts and authentication

There are **two separate kinds of account**, and they share one name, which
is easy to confuse:

- **Mac accounts** are macOS users. They own files and run processes.
- **PostgreSQL roles** live *inside* the database cluster (stored in its
  `pg_authid` catalog). They own databases/tables and log in to PostgreSQL.

A PostgreSQL role is not a Mac account. `renemurillo` exists twice: once as
your Mac login and once as a PostgreSQL role that Homebrew's `initdb` named
after you.

Verified 2026-10-28 by inspecting the running server, the catalogs, and the
files.

### Mac accounts

| Mac account | Role in this setup |
|-------------|--------------------|
| `renemurillo` (uid 501, in the `admin` group) | **Owns all database files**: `/opt/homebrew/var/postgresql@18` is `drwx------ renemurillo:admin`; every file inside is owned by it, and `postgresql.conf`/`pg_hba.conf` are mode `600`. **Runs the server**: the `postgres` main process and all its child processes run as `renemurillo`, because you start them yourself with `npm run db:start`. Also owns `server/.env` (mode `600`). |
| `_postgres` | A built-in macOS system account that ships with macOS. **Not used** by this setup. Ignore it. |
| `root` | **Disabled** (no password or authentication set) and **not needed**. Never use `sudo` for any database command here. PostgreSQL refuses to run as root anyway. |

There is no dedicated service account and no background service. The server
exists only while you've started it.

### PostgreSQL roles

| Attribute | `renemurillo` (administrator) | `markov_app` (application) |
|-----------|-------------------------------|----------------------------|
| Created by | Homebrew's `initdb` at install | This setup, `CREATE ROLE … LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION` |
| Superuser | **yes** | **no** |
| Create roles / databases | yes / yes | **no / no** |
| Replication / bypass row-level security | yes / yes | **no / no** |
| Can log in | yes | yes |
| Member of other roles | n/a | **none** (inherits no extra privileges) |
| Connection limit / expiry | none / none | none / none |
| Stored password | **none** (no password exists) | SCRAM-SHA-256 hash in `pg_authid` (never plaintext) |
| How it authenticates | `peer` over the Unix socket only | `scram-sha-256` password over TCP localhost only |
| Owns | `postgres`, `template0`, `template1` | `markov_midi_graph_dev` |

### What `markov_app` can and cannot do (each tested)

| Can | Cannot (error received) |
|-----|-------------------------|
| Connect to `markov_midi_graph_dev` and create/alter/drop tables, schemas, and data there (it's the database owner, and in PG 15+ the `public` schema belongs to the database owner) | Create a database: `permission denied to create database` |
| Create session-only temporary tables | Create a role: `Only roles with the CREATEROLE attribute may create roles` |
| Connect to `postgres`/`template1` (PostgreSQL's default `PUBLIC` CONNECT), but only to look around | Create anything in the `postgres` database: `permission denied for schema public` |
| | Read password hashes: `permission denied for table pg_authid` |
| | Read server files: `permission denied for function pg_read_file` |
| | Change server settings: `permission denied to set parameter` (`ALTER SYSTEM`) |
| | Become the superuser: `permission denied to set role "renemurillo"` |

Conclusion: `markov_app` is correctly restricted. It's a normal login role
with full control of **its own** database and nothing else.

### Who can log in, and how (`/opt/homebrew/var/postgresql@18/pg_hba.conf`)

PostgreSQL reads this file top to bottom and uses the first matching line.

| Connection | Method | Meaning |
|------------|--------|---------|
| Unix socket (`local`), socket file in `/tmp` | `peer` | PostgreSQL asks macOS which Mac account is on the other end and only allows the PostgreSQL role **with the same name**. Your Mac account `renemurillo` gets the role `renemurillo`, with no password. Any other Mac user, or an attempt like `psql -U markov_app` over the socket, is rejected (`Peer authentication failed`) |
| TCP 127.0.0.1 / ::1 (`host`) | `scram-sha-256` | Password required. This is how the backend and `npm run db:psql-app` connect as `markov_app`. The superuser can't use this path because it has no password (`fe_sendauth: no password supplied`) |
| Anything else | rejected | There are no rules for other addresses, and the server only listens on localhost (`listen_addresses = localhost`) anyway |

Other verified server settings: `password_encryption = scram-sha-256`,
`unix_socket_directories = /tmp`, `ssl = off` (fine: traffic never leaves this
Mac). The socket file is world-accessible (`0777`, the default), but `peer`
still restricts each Mac user to a same-named role, and only `renemurillo` has one.

Homebrew's original file (which trusted **every** local connection without a
password) is saved as `/opt/homebrew/var/postgresql@18/pg_hba.conf.homebrew-default`.
The `listen_addresses`/`port` lines are appended at the bottom of
`/opt/homebrew/var/postgresql@18/postgresql.conf`.

### Connecting as the administrator

You must be logged in to the Mac as `renemurillo`, and the server must be running.

```bash
# from server/ (wrapper script)
npm run db:psql

# the same thing from any directory, spelled out
/opt/homebrew/opt/postgresql@18/bin/psql -d markov_midi_graph_dev
```

There's no `-U` and no `-h`: psql defaults to the role named after your Mac
account and to the Unix socket in `/tmp`, so `peer` authentication applies and
**no password is asked or needed**. Confirm inside psql with `\conninfo`; it
should show `Client User | renemurillo`, `Socket Directory | /tmp`,
`Password Used | false`, `Superuser | on`. Use `-d postgres` instead to work
outside the app database.

Use the administrator only for administration (roles, passwords, extensions,
inspecting the server). Do day-to-day app work as `markov_app`.

### Where the application credentials live

| Item | Location |
|------|----------|
| Connection settings + password the backend uses | `server/.env` (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`). Mode `600`, owned by Mac account `renemurillo`, git-ignored (`server/.gitignore`), never committed |
| Template without secrets | `server/.env.example` (committed) |
| Server-side copy | Only a SCRAM-SHA-256 **hash** in `pg_authid`, readable only by a superuser. The plaintext password can't be recovered from it; `server/.env` is the only plaintext copy |

Locate credentials safely, without printing the password: see
[Recover connection details](#recover-connection-details-without-printing-the-password)
below. In short: `grep -v '^PGPASSWORD' .env` from `server/`. If the password
is lost, reset it with `\password markov_app` as the administrator.

### When you finish inspecting

```bash
npm run db:stop      # from server/: clean "fast" shutdown of this cluster only
npm run db:status    # expect: pg_ctl: no server running
```

### Optional hardening (not applied)

By PostgreSQL default, every role, `markov_app` included, may *connect* to
`postgres` and `template1`, though it can't create anything there. To block
even that, run this as the administrator:
`REVOKE CONNECT ON DATABASE postgres FROM PUBLIC;`. It's not needed for local
development.

### Connect and inspect

```bash
npm run db:psql        # as superuser renemurillo, into markov_midi_graph_dev (socket)
npm run db:psql-app    # as markov_app, using server/.env (TCP, like the API)
```

Handy `psql` commands once inside:

```
\conninfo          who/where am I connected
\l                 list databases
\du                list roles and their attributes
\dn                list schemas
\dt                list tables (empty for now)
\d table_name      describe a table
\x                 toggle expanded output
\q                 quit
```

GUI clients (TablePlus, DBeaver, pgAdmin…) work too: host `localhost`, port
`5432`, database `markov_midi_graph_dev`, user `markov_app`, password from
`server/.env`.

---

## Configuration and credentials

| File | In git? | Purpose |
|------|---------|---------|
| `server/.env.example` | yes | Template with placeholder values |
| `server/.env` | **no** (`server/.gitignore`) | Real values, including the password. Permissions `600` (only you can read it) |
| `server/.nvmrc` | yes | Node major version for `nvm use` |
| `server/.api.pid` | **no** (`server/.gitignore`) | Process IDs of the running API; created on start, deleted on clean exit. Safe to delete when the API is stopped |
| `/opt/homebrew/var/postgresql@18/postgresql.conf` | n/a | PostgreSQL server settings |
| `/opt/homebrew/var/postgresql@18/pg_hba.conf` | n/a | PostgreSQL login rules |

Environment variables (loaded by `node --env-file-if-exists=.env`, validated in
`server/src/config.ts`):

| Name | Value here | Used by |
|------|------------|---------|
| `HOST` | `127.0.0.1` | Express bind address |
| `PORT` | `4000` | Express port |
| `PGHOST` | `localhost` | pg + psql |
| `PGPORT` | `5432` | pg + psql |
| `PGDATABASE` | `markov_midi_graph_dev` | pg + psql |
| `PGUSER` | `markov_app` | pg + psql |
| `PGPASSWORD` | *(secret, only in `server/.env`)* | pg + psql |

The `PG*` names are libpq's standard variables, so the pg driver and `psql`
both pick them up automatically with no extra code.

### Recover connection details without printing the password

```bash
# from server/: show everything except the password
grep -v '^PGPASSWORD' .env
# check that a password is set, without showing it
grep -q '^PGPASSWORD=.\+' .env && echo "password is set"
# prove the password works
npm run db:psql-app -- -c 'select 1'
```

### Lost or need a new password? Reset it (as superuser)

```bash
npm run db:psql
# then inside psql: prompts twice, hashes locally, never echoes or logs plaintext
\password markov_app
\q
```

Then put the new value on the `PGPASSWORD=` line in `server/.env`. To generate
a random one: `openssl rand -hex 24`.

### Fresh clone / `.env` missing

The role's password can't be read back from PostgreSQL, so a new `.env`
needs a new password. From `server/`, run the block in
[Fresh-machine setup, step 8](#8-private-environment-file--app-password-from-server).
It creates `.env` and sets a fresh random password on `markov_app` without
printing it. Any older copy of `.env` (e.g. in another clone) stops working
until you copy the new `PGPASSWORD` line into it.

---

## Where the code lives

```
server/
├── README.md               ← this file
├── package.json            scripts + dependencies (separate from the React app)
├── tsconfig.json           type-check settings for Node's TS type stripping
├── .env.example / .env     config template / real config (git-ignored)
├── .api.pid                exists only while the API runs: its process IDs (git-ignored)
├── .nvmrc                  "24"
├── scripts/
│   ├── db.sh               start | stop | status | psql | psql-app
│   └── api.sh              status | stop (verifies process identity before signaling)
└── src/
    ├── index.ts            builds the Express app, mounts REST + Apollo, listens, graceful shutdown
    ├── config.ts           reads + validates env vars
    ├── pidFile.ts          writes/removes server/.api.pid
    ├── routes/
    │   └── health.ts       REST: GET /api/health
    ├── graphql/
    │   ├── schema.ts       GraphQL type definitions (SDL)
    │   └── resolvers.ts    functions that answer each Query field
    └── db/
        ├── pool.ts         the shared pg Pool + query() helper
        └── health.ts       checkDatabase(), used by both REST and GraphQL
```

### Adding a REST route later (the pattern)

1. **Data access** goes in `src/db/<thing>.ts`: export async functions that call
   `query()` from `./pool.ts`. Always use placeholders for input:
   `query("select … where id = $1", [id])`. Never build SQL with string
   concatenation (SQL injection).
2. **Route**: create `src/routes/<thing>.ts` with an `express.Router()`, add
   `router.get(...)`/`router.post(...)` handlers that call your db functions and
   `res.json(...)` the result. `req.body` is already parsed JSON
   (`express.json()` in `index.ts`). In Express 5 a thrown error or rejected
   promise in an async handler goes to Express's error handler automatically.
3. **Mount** it in `src/index.ts`: `app.use("/api", thingRouter)`. Add it before
   `app.use("/graphql", …)`, next to `healthRouter`. Imports use the `.ts` suffix.
4. **Check**: `npm run typecheck`, then `curl` it. `npm run dev` reloads on save.

GraphQL is the same idea: add types/fields to `schema.ts`, add a matching
function under `Query` (or `Mutation`) in `resolvers.ts`, and call the same
`src/db/` functions.

Note for later: when the React app (on :5173) starts calling the API (on
:4000), the browser treats them as different origins. The usual fix in
development is a Vite `server.proxy` entry for `/api` and `/graphql` in the
root `vite.config.ts`; the alternative is adding the `cors` package.

---

## Troubleshooting

### Database is stopped

Symptoms: `/api/health` returns **503** with
`"error":"connect ECONNREFUSED ::1:5432; connect ECONNREFUSED 127.0.0.1:5432"`;
`psql: … Connection refused`; `npm run db:status` says `no server running`.

```bash
npm run db:start          # from server/
```

If start fails, read the log: `tail -50 /opt/homebrew/var/log/postgresql@18.log`.
After a crash or power loss it may complain about a stale lock file. **Only if**
`ps aux | grep '[p]ostgres'` shows nothing running, remove the stale file:
`rm /opt/homebrew/var/postgresql@18/postmaster.pid`, then start again.

### Port already in use

API: `Error: listen EADDRINUSE: address already in use 127.0.0.1:4000`.
PostgreSQL log: `could not bind … Address already in use`.

```bash
lsof -nP -iTCP:4000 -sTCP:LISTEN     # or :5432. Shows the command + PID holding it
```

- For 4000, run `npm run api:status` first. It says either
  `api: running (server pid …)` (an old copy of **this** API; stop it with
  `npm run api:stop`) or `port 4000 is in use by another program (pid …, not
  this backend)`. `api:stop` deliberately won't touch that other program.
- If it's something else you need, change `PORT=` in `server/.env` instead.
- For 5432, another PostgreSQL may be running (e.g. Postgres.app). Stop that one
  in its own way, or change `port` at the bottom of `postgresql.conf` **and**
  `PGPORT` in `.env`.

### Connection or authentication failures

| Message | Cause / fix |
|---------|-------------|
| `password authentication failed for user "markov_app"` | `PGPASSWORD` in `.env` doesn't match. Reset it (see above) |
| `fe_sendauth: no password supplied` | `PGPASSWORD` missing/empty in the environment |
| `Peer authentication failed for user "markov_app"` | You connected over the socket (no `-h localhost`). Use `npm run db:psql-app`, which uses TCP |
| `database "markov_midi_graph_dev" does not exist` | Check `\l` in `npm run db:psql`; check `PGDATABASE` spelling |
| `role "…" does not exist` | Check `\du`; check `PGUSER` |

### Missing environment configuration

The API refuses to start and prints:

```
Error: Missing environment variables: HOST, PORT, PGHOST, ….
Create server/.env from server/.env.example (see server/README.md).
```

Fix: see [Fresh clone / `.env` missing](#fresh-clone--env-missing). Make sure
you ran the command from `server/` (the `.env` path is relative to it).

### Other

- `SyntaxError`/`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` on start: you used TS-only
  runtime syntax (e.g. `enum`); Node's type stripping can't run it. Use a union
  type or `as const` object instead. `npm run typecheck` flags these too.
- `ERR_MODULE_NOT_FOUND` for a local file: imports need the `.ts` extension.
- `node: bad option: --env-file-if-exists` or `nvm: command not found`: the
  wrong Node is active. Run `nvm use` in `server/` (`node -v` should say v24).

---

## After a reboot / confirming nothing starts automatically

After a reboot (or logout) **nothing from this setup is running**. PostgreSQL
and the API stay off until you run the
[Everyday start](#everyday-start-existing-setup). Your data persists on disk
in `/opt/homebrew/var/postgresql@18`.

To confirm autostart is disabled:

```bash
brew services info postgresql@18
#   expect: Running: false   Loaded: false
launchctl list | grep -iE 'postgres|markov'
#   expect: no output
ls ~/Library/LaunchAgents /Library/LaunchAgents /Library/LaunchDaemons | grep -iE 'postgres|markov'
#   expect: no output
ps aux | grep -E '[p]ostgres|[s]rc/index.ts'
#   right after boot, expect: no output
```

**Never run `brew services start postgresql@18`**: that's the command that
*would* register a login item (a LaunchAgent plist). If you ever do by accident,
undo it with `brew services stop postgresql@18`.

---

## Uninstall (if ever needed)

From `server/`: `npm run api:stop; npm run db:stop`, then
`brew uninstall postgresql@18`. This removes the binaries; the data directory
`/opt/homebrew/var/postgresql@18` is kept until you delete it yourself
(**that deletes all databases**). The `server/` folder can be removed like any
other folder.
