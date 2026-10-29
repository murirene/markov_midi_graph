import pg from "pg"

// One shared connection pool for the whole process. With no arguments,
// node-postgres reads PGHOST, PGPORT, PGDATABASE, PGUSER and PGPASSWORD
// from the environment, the same variables psql uses.
export const pool = new pg.Pool({ max: 10 })

// If PostgreSQL drops an idle connection (e.g. the database is stopped), the
// pool emits 'error'. Without a listener Node treats that as fatal and the
// whole API crashes. Log it instead; the pool replaces the broken client.
pool.on("error", (err) => {
  console.error("Idle database connection lost:", err.message)
})

// Thin wrapper so REST handlers and GraphQL resolvers share one entry point.
// Always pass user input through `params` ($1, $2, ...), never string-concatenate.
export function query<Row extends pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return pool.query<Row>(text, params)
}
