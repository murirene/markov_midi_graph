import { describe, expect, it } from "vitest";
import Edge from "./Edge";

describe("Edge", () => {
  it("stores from node, to node, and weight", () => {
    const edge = new Edge(1, 2, 0.75);

    expect(edge.from_node).toBe(1);
    expect(edge.to_node).toBe(2);
    expect(edge.weight).toBe(0.75);
  });

  it("allows weight to be updated", () => {
    const edge = new Edge(1, 2, 0.75);

    edge.weight = 0.9;

    expect(edge.weight).toBe(0.9);
  });

  it("returns a readable string", () => {
    const edge = new Edge(1, 2, 0.75);

    expect(edge.toString()).toBe("(1) --0.75--> (2)");
  });
});
