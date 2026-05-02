export class Graph<T> {
  private nodes: Map<Node<T>>
  private node_counter: number
  constructor() {
    this.nodes = new Map<number, Node<T>>()
    this.node_counter = 0
  }

  private isValidNode = (id: number):boolean => id >= 0 && id < this.node_counter && this.nodes.has(id) 

  addNode(value: T) {
    this.nodes.set(this.node_counter, new Node(this.node_counter, value)
    this.node_counter++
  }

  removeNode(id: number) {
    this.nodes.delete(id)
  }

  insertEdge(from_node: number, to_node: number, weight: number) {
    if(!(isValidNode(from_node) && isValidNode(to_node))) {
      return 
    }

    this.nodes.get(from_node).addNeighbor(to_node, weight)
  }
  
  removeEdge(from_node: number, to_node: number) {
    if(!(isValidNode(from_node) && isValidNode(to_node)) && this.nodes.get(from_node).hasNeighbor(to_node)) {
      return 
    }

    this.nodes.get(from_node).removeNeighbor(to_node)
  }
}
