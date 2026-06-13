import { describe, expect, it } from "vitest";
import Node from "./Node";

const defaultCoordinate = { x: 100, y: 200 };

describe("Node", () => {
  it("stores an id, value, and coordinate", () => {
    const node = new Node(0, "C4", defaultCoordinate);

    expect(node.id).toBe(0);
    expect(node.value).toBe("C4");
    expect(node.coordinate).toEqual(defaultCoordinate);
  });

  it("starts with no edges", () => {
    const node = new Node(0, "C4", defaultCoordinate);

    expect(node.getEdges()).toEqual([]);
  });

  it("can add a neighbor edge", () => {
    const node = new Node(0, "C4", defaultCoordinate);

    node.addNeighbor(1, 0.75);

    const edges = node.getEdges();

    expect(edges).toHaveLength(1);
    expect(edges[0].fromNodeId).toBe(0);
    expect(edges[0].toNodeId).toBe(1);
    expect(edges[0].weight).toBe(0.75);
  });

  it("can remove a neighbor edge", () => {
    const node = new Node(0, "C4", defaultCoordinate);

    node.addNeighbor(1, 0.75);
    node.addNeighbor(2, 0.5);

    node.removeNeighbor(1);

    const edges = node.getEdges();

    expect(edges).toHaveLength(1);
    expect(edges[0].toNodeId).toBe(2);
  });

  it("does nothing when removing a missing neighbor", () => {
    const node = new Node(0, "C4", defaultCoordinate);

    node.addNeighbor(1, 0.75);
    node.removeNeighbor(99);

    const edges = node.getEdges();

    expect(edges).toHaveLength(1);
    expect(edges[0].toNodeId).toBe(1);
  });

  it("hasNeighbor returns true when the neighbor exists", () => {
    const node = new Node(0, "C4", defaultCoordinate);

    node.addNeighbor(1, 0.5);

    expect(node.hasNeighbor(1)).toBe(true);
  });

  it("hasNeighbor returns false when the neighbor does not exist", () => {
    const node = new Node(0, "C4", defaultCoordinate);

    expect(node.hasNeighbor(99)).toBe(false);
  });

  it("does not create a duplicate edge when the same neighbor is added twice", () => {
    const node = new Node(0, "C4", defaultCoordinate);

    node.addNeighbor(1, 0.5);
    node.addNeighbor(1, 0.9);

    const edges = node.getEdges();

    expect(edges).toHaveLength(1);
    expect(edges[0].weight).toBe(0.5);
  });

  it("stores coordinate as a copy, not a reference", () => {
    const coord = { x: 10, y: 20 };
    const node = new Node(0, "C4", coord);

    coord.x = 999;

    expect(node.coordinate.x).toBe(10);
  });

  it("returns a readable string", () => {
    const node = new Node(0, "C4", defaultCoordinate);

    expect(node.toString()).toBe("0 C4 (100, 200)");
  });

  it("clone produces an equal but independent node", () => {
    const node = new Node(0, "C4", defaultCoordinate);
    node.addNeighbor(1, 0.75);

    const copy = node.clone();

    expect(copy.id).toBe(node.id);
    expect(copy.value).toBe(node.value);
    expect(copy.coordinate).toEqual(node.coordinate);
    expect(copy.getEdges()).toHaveLength(1);
    expect(copy.getEdges()[0].weight).toBe(0.75);
  });

  it("updateCoordinate changes the node position", () => {
    const node = new Node(0, "C4", { x: 0, y: 0 });

    node.updateCoordinate(50, 75);

    expect(node.coordinate).toEqual({ x: 50, y: 75 });
  });

  it("clone edges are independent from the original", () => {
    const node = new Node(0, "C4", defaultCoordinate);
    node.addNeighbor(1, 0.75);

    const copy = node.clone();
    copy.getEdges()[0].weight = 0.01;

    expect(node.getEdges()[0].weight).toBe(0.75);
  });
});
