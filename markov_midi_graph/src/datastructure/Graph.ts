import Node from "./Node"
import { logError } from "./logger"

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
      logError(`Graph.removeNode: node ${id} does not exist`)
      return this
    }

    this.nodes.delete(id)

    for (const node of this.nodes.values()) {
      if (node.hasNeighbor(id)) {
        node.removeNeighbor(id)
      }
    }

    return this
  }

  insertEdge(from_node: number, to_node: number, weight: number): this {
    if (!this.isValidNode(from_node)) {
      logError(`Graph.insertEdge: from node ${from_node} does not exist`)
      return this
    }

    if (!this.isValidNode(to_node)) {
      logError(`Graph.insertEdge: to node ${to_node} does not exist`)
      return this
    }

    const from = this.nodes.get(from_node)
    if (!from) {
      logError(`Graph.insertEdge: could not retrieve node ${from_node}`)
      return this
    }

    from.addNeighbor(to_node, weight)

    return this
  }

  removeEdge(from_node: number, to_node: number): this {
    if (!this.isValidNode(from_node)) {
      logError(`Graph.removeEdge: from node ${from_node} does not exist`)
      return this
    }

    if (!this.isValidNode(to_node)) {
      logError(`Graph.removeEdge: to node ${to_node} does not exist`)
      return this
    }

    const from = this.nodes.get(from_node)
    if (!from) {
      logError(`Graph.removeEdge: could not retrieve node ${from_node}`)
      return this
    }

    if (!from.hasNeighbor(to_node)) {
      logError(`Graph.removeEdge: edge ${from_node} -> ${to_node} does not exist`)
      return this
    }

    from.removeNeighbor(to_node)

    return this
  }
}
