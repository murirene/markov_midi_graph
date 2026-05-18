export default class Edge {
  constructor(
    public readonly fromNodeId: number,
    public readonly toNodeId: number,
    public weight: number=0,
  ) {}
  
  toString(): string {
    return `(${this.fromNodeId}) --${this.weight}--> (${this.toNodeId})`
  }

  clone(): Edge {
    return new Edge(this.fromNodeId, this.toNodeId, this.weight)
  }
}
