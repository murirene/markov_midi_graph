import Edge from "./Edge"

type Coordinate = {
  x: number
  y: number
}

export default class Node<T> {
  private edgesByNeighborId: Map<number, Edge>
  public readonly value: T
  public readonly id: number
  public coordinate: Coordinate

  constructor(id: number, value: T, c: Coordinate) {
    this.id = id
    this.value = value
    this.coordinate = { ...c }
    this.edgesByNeighborId = new Map<number, Edge>()
  }

  addNeighbor(neighborId: number, weight: number): this {
    if (this.edgesByNeighborId.has(neighborId)) {
      return this
    }

    this.edgesByNeighborId.set(
      neighborId,
      new Edge(this.id, neighborId, weight),
    )

    return this
  }

  hasNeighbor(neighbor: number): boolean {
    return this.edgesByNeighborId.has(neighbor)
  }

  removeNeighbor(neighbor: number): this {
    if (!this.edgesByNeighborId.has(neighbor)) {
      return this
    }

    this.edgesByNeighborId.delete(neighbor)

    return this
  }

  updateCoordinate(x: number, y:number) {
    this.coordinate = {x,y}
    return this
  }

  toString(): string {
    return `${this.id} ${this.value} (${this.coordinate.x}, ${this.coordinate.y})`
  }

  clone(): Node<T> {
    const copyNode = new Node<T>(this.id, this.value, this.coordinate)
    this.edgesByNeighborId.forEach((edge) => copyNode.setEdge(edge.clone()))

    return copyNode
  }

  private setEdge(e: Edge): this {
    this.edgesByNeighborId.set(e.toNodeId, e)

    return this
  }

  getEdges(): Edge[] {
    return [...this.edgesByNeighborId.values()]
  }
}
