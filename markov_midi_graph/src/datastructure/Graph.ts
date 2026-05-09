import Node from "./Node"

export class Graph<T> {
  private nodes: Map<number, Node<T>>
  private node_counter: number

  constructor() {
    this.nodes = new Map<number, Node<T>>()
    this.node_counter = 0
  }

  private isValidNode = (id: number): boolean =>
    id >= 0 && id < this.node_counter && this.nodes.has(id)

  getNode(id: number): Node<T> | undefined {
    return this.nodes.get(id)
  }

  addNode(value: T): number {
    const id = this.node_counter
    this.nodes.set(id, new Node(id, value))
    this.node_counter++
    return id
  }

  removeNode(id: number) {
    if (!this.isValidNode(id)) {
      return
    }

    this.nodes.delete(id)

    // Remove all edges that point to this node
    for (const node of this.nodes.values()) {
      if (node.hasNeighbor(id)) {
        node.removeNeighbor(id)
      }
    }
  }

  insertEdge(from_node: number, to_node: number, weight: number) {
    if (!(this.isValidNode(from_node) && this.isValidNode(to_node))) {
      return
    }

    const from = this.nodes.get(from_node)
    if (!from) {
      return
    }

    from.addNeighbor(to_node, weight)
  }

  removeEdge(from_node: number, to_node: number) {
    if (!(this.isValidNode(from_node) && this.isValidNode(to_node))) {
      return
    }

    const from = this.nodes.get(from_node)
    if (!from || !from.hasNeighbor(to_node)) {
      return
    }

    from.removeNeighbor(to_node)
  }
}
