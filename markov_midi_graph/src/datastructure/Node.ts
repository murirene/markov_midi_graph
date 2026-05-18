import Edge from "./Edge"

type Coordinate = {
  x: number
  y: number
}

export default class Node<T> {
  private edges: Map<number, Edge>
  public readonly value: T
  public readonly id: number 
  public coordinate: Coordinate

  constructor( id: number, value: T, c: Coordinate) {
    this.id = id
    this.value = value
    this.coordinate = {...c}
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
    return `${this.id} ${this.value} (${this.coordinate.x}, ${this.coordinate.y})`
  }

  clone(): Node<T> {
    let {id, value, coordinate, edges} = ...this
    
    copyNode = new Node(id, value, coordinate)
    this.edges.foreach((to_edge_id: number, edge:Edge) => copyNode.setEdge(to_edge_id, edge)) 
  }

  getEdges(): Edge[] {
    return [...this.edges.values()]
  }

  setEdge(to_node: number, weight: number) {
    this.edges.set(to_number, new Edge(this.id, to_number, weight))
  }
}
