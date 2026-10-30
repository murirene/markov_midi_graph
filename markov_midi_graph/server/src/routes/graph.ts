import { Router } from "express"
import { getGraph } from "../db/graph.ts"

export const graphRouter = Router()

graphRouter.get("/graph/", async (_req, res) => {
  const graph = await getGraph()
  res.json(graph)
})
