// Reads settings from environment variables (loaded from server/.env by
// `node --env-file-if-exists=.env`) and fails fast with a readable message.

const required = [
  "HOST",
  "PORT",
  "PGHOST",
  "PGPORT",
  "PGDATABASE",
  "PGUSER",
  "PGPASSWORD",
]

const missing = required.filter((name) => !process.env[name])
if (missing.length > 0) {
  throw new Error(
    `Missing environment variables: ${missing.join(", ")}.\n` +
      "Create server/.env from server/.env.example (see server/README.md).",
  )
}

export const config = {
  host: process.env.HOST as string,
  port: Number(process.env.PORT),
}
