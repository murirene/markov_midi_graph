import Edge from "./Edge"

type Coordinate = {
  x: number
  y: number
}

export default class Node<T> {
  public readonly value: T
  public readonly nodeId: number
  public coordinate: Coordinate
  private edgesByNeighborId: Map<number, Edge>

  constructor(nodeId: number, value: T, c: Coordinate) {
    this.nodeId = nodeId
    this.value = value
    this.coordinate = { ...c }
    this.edgesByNeighborId = new Map<number, Edge>()
  }

  hasNeighbor(neighborId: number): boolean {
    return this.edgesByNeighborId.has(neighborId)
  }

  addNeighbor(neighborId: number, weight: number): this {
    if (this.hasNeighbor(neighborId)) {
      return this
    }

    this.edgesByNeighborId.set(
      neighborId,
      new Edge(this.nodeId, neighborId, weight),
    )

    return this
  }

  removeNeighbor(neighborId: number): this {
    if (!this.hasNeighbor(neighborId)) {
      return this
    }

    this.edgesByNeighborId.delete(neighborId)

    return this
  }

  updateCoordinate(x: number, y: number): this {
    this.coordinate = { x, y }
    return this
  }

  toString(): string {
    return `${this.nodeId} ${this.value} (${this.coordinate.x}, ${this.coordinate.y})`
  }

  clone(): Node<T> {
    const copyNode = new Node<T>(this.nodeId, this.value, this.coordinate)
    this.edgesByNeighborId.forEach((edge) =>
      copyNode.edgesByNeighborId.set(edge.toNodeId, edge.clone()),
    )

    return copyNode
  }

  getEdges(): Edge[] {
    return [...this.edgesByNeighborId.values()]
  }
}
