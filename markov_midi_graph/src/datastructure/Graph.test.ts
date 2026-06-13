import { describe, expect, it } from "vitest";
import { Graph } from "./Graph";

const defaultCoordinate = { x: 0, y: 0 };

describe("Graph", () => {
  it("adds nodes with sequential ids", () => {
    const graph = new Graph<string>();

    graph.addNode("C4", defaultCoordinate);
    graph.addNode("E4", defaultCoordinate);

    expect(graph.getNodes()).toHaveLength(2);
    expect(graph.getNode(0)?.value).toBe("C4");
    expect(graph.getNode(0)?.coordinate).toEqual(defaultCoordinate);
    expect(graph.getNode(1)?.value).toBe("E4");
  });

  it("returns undefined for a missing node", () => {
    const graph = new Graph<string>();

    expect(graph.getNode(999)).toBeUndefined();
  });

  it("adds a directed edge from one node to another", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.addNode("E4");
    const c = 0;
    const e = 1;

    graph.insertEdge(c, e, 0.75);

    const cEdges = graph.getNode(c)?.getEdges();
    const eEdges = graph.getNode(e)?.getEdges();

    expect(cEdges).toHaveLength(1);
    expect(cEdges?.[0].fromNodeId).toBe(c);
    expect(cEdges?.[0].toNodeId).toBe(e);
    expect(cEdges?.[0].weight).toBe(0.75);

    expect(eEdges).toEqual([]);
  });

  it("does not add an edge if the from node is missing", () => {
    const graph = new Graph<string>();

    graph.addNode("E4");
    const e = 0;

    graph.insertEdge(999, e, 0.75);

    expect(graph.getNode(e)?.getEdges()).toEqual([]);
  });

  it("does not add an edge if the to node is missing", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    const c = 0;

    graph.insertEdge(c, 999, 0.75);

    expect(graph.getNode(c)?.getEdges()).toEqual([]);
  });

  it("removes an edge", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.addNode("E4");
    const c = 0;
    const e = 1;

    graph.insertEdge(c, e, 0.75);
    graph.removeEdge(c, e);

    expect(graph.getNode(c)?.getEdges()).toEqual([]);
  });

  it("removes a node", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    const c = 0;

    graph.removeNode(c);

    expect(graph.getNode(c)).toBeUndefined();
    expect(graph.getNodes()).toHaveLength(0);
  });

  it("removes edges pointing to a removed node", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.addNode("E4");
    graph.addNode("G4");
    const c = 0;
    const e = 1;
    const g = 2;

    graph.insertEdge(c, e, 0.75);
    graph.insertEdge(g, e, 0.5);

    graph.removeNode(e);

    expect(graph.getNode(c)?.getEdges()).toEqual([]);
    expect(graph.getNode(g)?.getEdges()).toEqual([]);
  });

  it("does nothing when removing an edge that does not exist", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.addNode("E4");
    const c = 0;
    const e = 1;

    graph.removeEdge(c, e);

    expect(graph.getNode(c)?.getEdges()).toEqual([]);
  });

  it("does nothing when removing an edge using missing node ids", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    const c = 0;

    graph.removeEdge(c, 999);
    graph.removeEdge(999, c);

    expect(graph.getNode(c)?.getEdges()).toEqual([]);
  });

  it("does nothing when removing a missing node id", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    const c = 0;

    graph.removeNode(999);

    expect(graph.getNode(c)?.value).toBe("C4");
  });

  it("does not create duplicate edges when the same edge is inserted twice", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.addNode("E4");
    const c = 0;
    const e = 1;

    graph.insertEdge(c, e, 0.25);
    graph.insertEdge(c, e, 0.9);

    const edges = graph.getNode(c)?.getEdges();

    expect(edges).toHaveLength(1);
    expect(edges?.[0].fromNodeId).toBe(c);
    expect(edges?.[0].toNodeId).toBe(e);
    expect(edges?.[0].weight).toBe(0.25);
  });

  it("does not remove unrelated edges when a node is removed", () => {
    const graph = new Graph<string>();

    graph.addNode("A4");
    graph.addNode("B4");
    graph.addNode("C5");
    graph.addNode("D5");
    const a = 0;
    const b = 1;
    const c = 2;
    const d = 3;

    graph.insertEdge(a, b, 0.1);
    graph.insertEdge(c, d, 0.2);
    graph.insertEdge(d, c, 0.3);

    graph.removeNode(b);

    expect(graph.getNode(a)?.getEdges()).toEqual([]);

    const cEdges = graph.getNode(c)?.getEdges();
    const dEdges = graph.getNode(d)?.getEdges();
    expect(cEdges).toHaveLength(1);
    expect(cEdges?.[0].toNodeId).toBe(d);
    expect(dEdges).toHaveLength(1);
    expect(dEdges?.[0].toNodeId).toBe(c);
  });

  it("addNode defaults coordinate to (0, 0) when not provided", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");

    expect(graph.getNode(0)?.coordinate).toEqual({ x: 0, y: 0 });
  });

  it("allows a self-loop edge from a node to itself", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.insertEdge(0, 0, 1.0);

    const edges = graph.getNode(0)?.getEdges();

    expect(edges).toHaveLength(1);
    expect(edges?.[0].fromNodeId).toBe(0);
    expect(edges?.[0].toNodeId).toBe(0);
  });

  it("removeNode also removes its outgoing edges", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.addNode("E4");
    const c = 0;
    const e = 1;

    graph.insertEdge(c, e, 0.5);
    graph.removeNode(c);

    expect(graph.getNode(c)).toBeUndefined();
    expect(graph.getNode(e)?.getEdges()).toEqual([]);
  });

  it("hasEdge returns true when a directed edge exists", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.addNode("E4");
    graph.insertEdge(0, 1, 0.5);

    expect(graph.hasEdge(0, 1)).toBe(true);
  });

  it("hasEdge returns false when the edge does not exist", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.addNode("E4");

    expect(graph.hasEdge(0, 1)).toBe(false);
  });

  it("hasEdge is directional — true one way does not imply true the other", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.addNode("E4");
    graph.insertEdge(0, 1, 0.5);

    expect(graph.hasEdge(0, 1)).toBe(true);
    expect(graph.hasEdge(1, 0)).toBe(false);
  });

  it("getNeighbors returns the nodes a given node points to", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.addNode("E4");
    graph.addNode("G4");
    graph.insertEdge(0, 1, 0.5);
    graph.insertEdge(0, 2, 0.3);

    const neighbors = graph.getNeighbors(0);

    expect(neighbors).toHaveLength(2);
    expect(neighbors.map((n) => n.value)).toContain("E4");
    expect(neighbors.map((n) => n.value)).toContain("G4");
  });

  it("getNeighbors returns an empty array when the node has no outgoing edges", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");

    expect(graph.getNeighbors(0)).toEqual([]);
  });

  it("getNeighbors returns an empty array for a missing node id", () => {
    const graph = new Graph<string>();

    expect(graph.getNeighbors(999)).toEqual([]);
  });

  it("isEmpty returns true on a new graph", () => {
    const graph = new Graph<string>();

    expect(graph.isEmpty()).toBe(true);
  });

  it("isEmpty returns false after a node is added", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");

    expect(graph.isEmpty()).toBe(false);
  });

  it("isEmpty returns true after all nodes are removed", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.removeNode(0);

    expect(graph.isEmpty()).toBe(true);
  });

  it("clone produces a deep copy with the same nodes and edges", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.addNode("E4");
    graph.insertEdge(0, 1, 0.75);

    const copy = graph.clone();

    expect(copy.getNode(0)?.value).toBe("C4");
    expect(copy.getNode(1)?.value).toBe("E4");
    expect(copy.hasEdge(0, 1)).toBe(true);
  });

  it("clone is independent — modifying the copy does not affect the original", () => {
    const graph = new Graph<string>();

    graph.addNode("C4");
    graph.addNode("E4");
    graph.insertEdge(0, 1, 0.75);

    const copy = graph.clone();
    copy.removeNode(0);

    expect(graph.getNode(0)?.value).toBe("C4");
    expect(graph.getNodes()).toHaveLength(2);
  });

  it("keeps allocating new node ids even after removals", () => {
    const graph = new Graph<string>();

    graph.addNode("A4");
    graph.addNode("B4");
    graph.addNode("C5");
    graph.removeNode(1);
    graph.addNode("D5");

    expect(graph.getNode(0)?.value).toBe("A4");
    expect(graph.getNode(1)).toBeUndefined();
    expect(graph.getNode(2)?.value).toBe("C5");
    expect(graph.getNode(3)?.value).toBe("D5");
    expect(graph.getNodes()).toHaveLength(3);
  });
});
