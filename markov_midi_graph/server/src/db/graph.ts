import { query } from "./pool.ts"

export type Node = {
  nodeId: number
  value: string | null
  x: number
  y: number
}

export type Edge = {
  edgeId: number
  toNodeId: number
  fromNodeId: number
  weight: number
}

export type getGraphResponse = {
  nodes: Node[]
  edges: Edge[]
}

export async function getGraph(): Promise<getGraphResponse> {
  const nodePr = query("SELECT node_id, value, x, y FROM node")
  const edgePr = query(
    "SELECT edge_id, from_node_id, to_node_id, weight FROM edge",
  )

  return Promise.all([nodePr, edgePr]).then(([nodes, edges]) => {
    const n = nodes.rows.map((r) => ({
      nodeId: r.node_id,
      value: r.value,
      x: r.x,
      y: r.y,
    }))
    const e = edges.rows.map((r) => ({
      edgeId: r.edge_id,
      toNodeId: r.to_node_id,
      fromNodeId: r.from_node_id,
      weight: r.weight,
    }))

    return { nodes: n, edges: e }
  })
}
