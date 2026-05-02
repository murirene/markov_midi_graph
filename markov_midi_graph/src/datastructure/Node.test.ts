import { describe, expect, it } from "vitest";
import Node from "./Node";

describe("Node", () => {
  it("stores an id and value", () => {
    const node = new Node(0, "C4");

    expect(node.id).toBe(0);
    expect(node.value).toBe("C4");
  });

  it("starts with no edges", () => {
    const node = new Node(0, "C4");

    expect(node.getEdges()).toEqual([]);
  });

  it("can add a neighbor edge", () => {
    const node = new Node(0, "C4");

    node.addNeighbor(1, 0.75);

    const edges = node.getEdges();

    expect(edges).toHaveLength(1);
    expect(edges[0].from_node).toBe(0);
    expect(edges[0].to_node).toBe(1);
    expect(edges[0].weight).toBe(0.75);
  });

  it("can remove a neighbor edge", () => {
    const node = new Node(0, "C4");

    node.addNeighbor(1, 0.75);
    node.addNeighbor(2, 0.5);

    node.removeNeighbor(1);

    const edges = node.getEdges();

    expect(edges).toHaveLength(1);
    expect(edges[0].to_node).toBe(2);
  });

  it("does nothing when removing a missing neighbor", () => {
    const node = new Node(0, "C4");

    node.addNeighbor(1, 0.75);
    node.removeNeighbor(99);

    const edges = node.getEdges();

    expect(edges).toHaveLength(1);
    expect(edges[0].to_node).toBe(1);
  });
});
