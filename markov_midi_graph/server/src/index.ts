import http from "node:http"
import express from "express"
import { ApolloServer } from "@apollo/server"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import { expressMiddleware } from "@as-integrations/express5"
import { config } from "./config.ts"
import { pool } from "./db/pool.ts"
import { resolvers } from "./graphql/resolvers.ts"
import { typeDefs } from "./graphql/schema.ts"
import { removePidFile, writePidFile } from "./pidFile.ts"
import { healthRouter } from "./routes/health.ts"
import { graphRouter } from "./routes/graph.ts"

// One Express app serves both REST (/api/...) and GraphQL (/graphql).
const app = express()
const httpServer = http.createServer(app)

const apollo = new ApolloServer({
  typeDefs,
  resolvers,
  // Lets in-flight requests finish when the server shuts down.
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  // We handle SIGINT/SIGTERM ourselves below so the DB pool is closed too.
  stopOnTerminationSignals: false,
})
await apollo.start()

app.use(express.json())
app.use("/api", healthRouter)
app.use("/api", graphRouter)
app.use("/graphql", expressMiddleware(apollo))

httpServer.listen(config.port, config.host, () => {
  writePidFile()
  console.log(`REST     http://${config.host}:${config.port}/api/health`)
  console.log(`GraphQL  http://${config.host}:${config.port}/graphql`)
})

// Ctrl-C sends SIGINT; `npm run api:stop` and node --watch restarts send SIGTERM.
async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`)
  await apollo.stop() // also closes httpServer via the drain plugin
  await pool.end() // closes database connections
  removePidFile()
  process.exit(0)
}
process.once("SIGINT", () => void shutdown("SIGINT"))
process.once("SIGTERM", () => void shutdown("SIGTERM"))
