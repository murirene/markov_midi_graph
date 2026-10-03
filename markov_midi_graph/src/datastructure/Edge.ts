export default class Edge {
  public readonly fromNodeId: number
  public readonly toNodeId: number
  public weight: number

  constructor(fromNodeId: number, toNodeId: number, weight: number = 0) {
    this.fromNodeId = fromNodeId
    this.toNodeId = toNodeId
    this.weight = weight
  }

  toString(): string {
    return `(${this.fromNodeId}) --${this.weight}--> (${this.toNodeId})`
  }

  clone(): Edge {
    return new Edge(this.fromNodeId, this.toNodeId, this.weight)
  }
}
