import { Router } from "express"
import { checkDatabase } from "../db/health.ts"

export const healthRouter = Router()

// GET /api/health -> 200 when the database answers, 503 when it does not.
healthRouter.get("/health", async (_req, res) => {
  const database = await checkDatabase()
  res
    .status(database.ok ? 200 : 503)
    .json({ status: database.ok ? "ok" : "degraded", database })
})
