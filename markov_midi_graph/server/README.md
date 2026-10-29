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

## Quick start (copy, paste, in this order)

| # | Directory | Command | What it does |
|---|-----------|---------|--------------|
| 1 | `server/` | `nvm use` | Switch to Node 24 (reads `server/.nvmrc`) |
| 2 | `server/` | `npm install` | Only needed after a fresh clone or a dependency change |
| 3 | `server/` | `npm run db:start` | Start PostgreSQL |
| 4 | `server/` | `npm run dev` | Start the API (keeps this terminal busy; auto-restarts on file save) |
| 5 | `server/` (2nd terminal) | `npm run status` | Confirm DB and API are both up |
| 6 | project root (3rd terminal, optional) | `npm run dev` | Start the React app (Vite, http://localhost:5173) |

First time on a new machine/clone? You also need `server/.env`, see
[Configuration](#configuration-and-credentials).

### Shut down when you finish (reverse order)

| # | Where | Action |
|---|-------|--------|
| 1 | React terminal | `Ctrl-C` |
| 2 | API terminal | `Ctrl-C` (or from anywhere in `server/`: `npm run api:stop`) |
| 3 | `server/` | `npm run db:stop` |
| 4 | `server/` | `npm run status`: expect `no server running` and `api: nothing listening` |

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

`npm run api:stop` sends SIGTERM to processes whose command line contains
`env-file-if-exists=.env src/index.ts`, which only matches this backend. The API
handles SIGINT/SIGTERM by finishing in-flight requests, closing the DB pool, and
exiting with code 0.

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
| Database | `markov_midi_graph_dev` (UTF8), owned by `markov_app` |
| App role | `markov_app`: LOGIN, **not** superuser, cannot create databases or roles. As owner of the DB it *can* create tables in the `public` schema (for your future graph tables) |
| Admin/superuser role | `renemurillo` (same name as your macOS user, created by Homebrew) |
| Other databases | `postgres`, `template0`, `template1` (built-in; leave them alone) |

### Who can log in, and how (`/opt/homebrew/var/postgresql@18/pg_hba.conf`)

| Connection | Method | Meaning |
|------------|--------|---------|
| Unix socket (`local`) | `peer` | Postgres checks your macOS username. `renemurillo` can connect as `renemurillo` with no password; nobody can impersonate another role this way |
| TCP 127.0.0.1 / ::1 (`host`) | `scram-sha-256` | Password required. This is how the backend connects as `markov_app` |
| Anything else | rejected | There are no rules for other addresses, and the server only listens on localhost anyway |

Homebrew's original file (which trusted **every** local connection without a
password) is saved as `/opt/homebrew/var/postgresql@18/pg_hba.conf.homebrew-default`.
The `listen_addresses`/`port` lines are appended at the bottom of
`/opt/homebrew/var/postgresql@18/postgresql.conf`.

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

```bash
cd server
cp .env.example .env && chmod 600 .env
# edit .env: set PGPASSWORD (reset it as shown above if you don't know it)
```

---

## Where the code lives

```
server/
├── README.md               ← this file
├── package.json            scripts + dependencies (separate from the React app)
├── tsconfig.json           type-check settings for Node's TS type stripping
├── .env.example / .env     config template / real config (git-ignored)
├── .nvmrc                  "24"
├── scripts/
│   ├── db.sh               start | stop | status | psql | psql-app
│   └── api.sh              status | stop
└── src/
    ├── index.ts            builds the Express app, mounts REST + Apollo, listens, graceful shutdown
    ├── config.ts           reads + validates env vars
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

- If it's an old copy of this API: `npm run api:stop`.
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
and the API stay off until you run the Quick start. Your data persists on disk
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
