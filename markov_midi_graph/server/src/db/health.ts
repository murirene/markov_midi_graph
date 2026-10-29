import { query } from "./pool.ts"

export type DatabaseHealth = {
  ok: boolean
  database: string | null
  role: string | null
  serverTime: string | null
  error: string | null
}

// Runs a trivial query to prove the backend can reach PostgreSQL.
// Used by both GET /api/health and the GraphQL `health` query.
export async function checkDatabase(): Promise<DatabaseHealth> {
  try {
    const { rows } = await query<{ database: string; role: string; now: Date }>(
      "select current_database() as database, current_user as role, now() as now",
    )
    const row = rows[0]
    return {
      ok: true,
      database: row.database,
      role: row.role,
      serverTime: row.now.toISOString(),
      error: null,
    }
  } catch (err) {
    return {
      ok: false,
      database: null,
      role: null,
      serverTime: null,
      error: describeError(err),
    }
  }
}

// "localhost" resolves to both ::1 and 127.0.0.1, so a refused connection
// arrives as an AggregateError with an empty message; unwrap it.
function describeError(err: unknown): string {
  if (err instanceof AggregateError) {
    return err.errors.map(describeError).join("; ")
  }
  if (err instanceof Error) return err.message || err.name
  return String(err)
}
