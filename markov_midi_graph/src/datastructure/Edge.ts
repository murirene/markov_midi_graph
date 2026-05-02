export default class Edge {
  constructor(
    public readonly from_node: number,
    public readonly to_node: number,
    public weight: number=0,
  ) {}
  
  toString(): string {
    return `(${this.from_node}) --${this.weight}--> (${this.to_node})`
  }
}
