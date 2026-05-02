import Edge from "./Edge"

export default class Node<T> {
  private edges: Map<number, Edge>
  private value: T
  public readonly id: number 
  public getEdges = (): [Edge] => [...this.edges.values()]

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

  removeNeighbor(neighbor: number) {
    if (!this.edges.has(neighbor)) {
      return
    }

    this.edges.delete(neighbor)
  }

  toString():string {
    return `${this.id} ${this.value}`
  }

  getEdges(): [Edge] {
    return 
  }
}
