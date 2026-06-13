import Node from "./Node"

export class Graph<T> {
  private nodes: Map<number, Node<T>>
  private node_counter: number

  constructor() {
    this.nodes = new Map<number, Node<T>>()
    this.node_counter = 0
  }

  private isValidNode = (id: number): boolean => id >= 0 && this.nodes.has(id)

  getNodes(): Node<T>[] {
    return [...this.nodes.values()]
  }

  getNode(id: number): Node<T> | undefined {
    return this.nodes.get(id)
  }

  addNode(value: T, coordinate = { x: 0, y: 0 }): this {
    const id = this.node_counter
    this.nodes.set(id, new Node(id, value, coordinate))
    this.node_counter++

    return this
  }

  removeNode(id: number): this {
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

    return this
  }

  insertEdge(from_node: number, to_node: number, weight: number): this {
    if (!(this.isValidNode(from_node) && this.isValidNode(to_node))) {
      return this
    }

    const from = this.nodes.get(from_node)
    if (!from) {
      return this
    }

    from.addNeighbor(to_node, weight)

    return this
  }

  removeEdge(from_node: number, to_node: number): this {
    if (!(this.isValidNode(from_node) && this.isValidNode(to_node))) {
      return this
    }

    const from = this.nodes.get(from_node)
    if (!from || !from.hasNeighbor(to_node)) {
      return this
    }

    from.removeNeighbor(to_node)

    return this
  }
}
