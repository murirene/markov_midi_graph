import Edge from "./Edge"

export default class Node<T> {
  private edges: Map<number, Edge>
  public readonly value: T
  public readonly id: number 

  constructor( id: number, value: T) {
    this.id = id
    this.value = value
    this.edges = new Map<number, Edge>()
  }

  addNeighbor(neighbor: number, weight: number) {
    if (this.edges.has(neighbor)) {
      return
    }

    this.edges.set(neighbor, new Edge(this.id, neighbor, weight))
  }

  hasNeighbor(neighbor: number): boolean {
    return this.edges.has(neighbor)
  }

  removeNeighbor(neighbor: number) {
    if (!this.edges.has(neighbor)) {
      return
    }

    this.edges.delete(neighbor)
  }

  toString():string {
    return `${this.id} ${this.value}`
  }

  getEdges(): Edge[] {
    return [...this.edges.values()]
  }
}
