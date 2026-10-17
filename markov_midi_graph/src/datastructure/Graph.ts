import Node from "./Node"

export default class Graph<T> {
  private nodes: Map<number, Node<T>>
  private nodeIdSeq: number

  constructor() {
    this.nodes = new Map<number, Node<T>>()
    this.nodeIdSeq = 0
  }

  clone(): Graph<T> {
    const graphCopy = new Graph<T>()
    for (const [nodeId, node] of this.nodes) {
      graphCopy.nodes.set(nodeId, node.clone())
    }

    graphCopy.nodeIdSeq = this.nodeIdSeq

    return graphCopy
  }

  isEmpty(): boolean {
    return this.nodes.size === 0
  }

  getNode(nodeId: number): Node<T> | undefined {
    return this.nodes.get(nodeId)
  }

  getNodes(): Node<T>[] {
    return [...this.nodes.values()]
  }

  // returns the nodes its connected too
  getNeighbors(nodeId: number): Node<T>[] {
    return (
      this.nodes
        .get(nodeId)
        ?.getEdges()
        .map((edge) => this.nodes.get(edge.toNodeId))
        .filter((v) => v != undefined) ?? []
    )
  }

  addNode(value: T, coordinate = { x: 0, y: 0 }): this {
    const nodeId = this.nodeIdSeq++
    this.nodes.set(nodeId, new Node(nodeId, value, coordinate))

    return this
  }

  removeNode(nodeId: number): this {
    if (!this.nodes.has(nodeId)) {
      return this
    }

    // remove the node itself
    this.nodes.delete(nodeId)

    // remove any edges too the node being removed
    for (const node of this.nodes.values()) {
      if (node.hasNeighbor(nodeId)) {
        node.removeNeighbor(nodeId)
      }
    }

    return this
  }

  insertEdge(fromNodeId: number, toNodeId: number, weight: number): this {
    const fromNode = this.nodes.get(fromNodeId)
    const toNode = this.nodes.get(toNodeId)

    if (fromNode == undefined || toNode == undefined) return this

    fromNode.addNeighbor(toNodeId, weight)

    return this
  }

  removeEdge(fromNodeId: number, toNodeId: number): this {
    if (!this.nodes.has(fromNodeId) || !this.nodes.has(toNodeId)) {
      return this
    }

    this.nodes.get(fromNodeId)?.removeNeighbor(toNodeId)

    return this
  }

  hasEdge(fromNodeId: number, toNodeId: number): boolean {
    return this.nodes.get(fromNodeId)?.hasNeighbor(toNodeId) ?? false
  }
}
