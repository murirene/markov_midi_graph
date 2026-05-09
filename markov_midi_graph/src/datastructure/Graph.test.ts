import { describe, expect, it } from "vitest";
import { Graph } from "./Graph";

describe("Graph", () => {
  it("adds nodes and returns their ids", () => {
    const graph = new Graph<string>();

    const c = graph.addNode("C4");
    const e = graph.addNode("E4");

    expect(c).toBe(0);
    expect(e).toBe(1);

    expect(graph.getNode(c)?.value).toBe("C4");
    expect(graph.getNode(e)?.value).toBe("E4");
  });

  it("returns undefined for a missing node", () => {
    const graph = new Graph<string>();

    expect(graph.getNode(999)).toBeUndefined();
  });

  it("adds a directed edge from one node to another", () => {
    const graph = new Graph<string>();

    const c = graph.addNode("C4");
    const e = graph.addNode("E4");

    graph.insertEdge(c, e, 0.75);

    const cEdges = graph.getNode(c)?.getEdges();
    const eEdges = graph.getNode(e)?.getEdges();

    expect(cEdges).toHaveLength(1);
    expect(cEdges?.[0].from_node).toBe(c);
    expect(cEdges?.[0].to_node).toBe(e);
    expect(cEdges?.[0].weight).toBe(0.75);

    expect(eEdges).toEqual([]);
  });

  it("does not add an edge if the from node is missing", () => {
    const graph = new Graph<string>();

    const e = graph.addNode("E4");

    graph.insertEdge(999, e, 0.75);

    expect(graph.getNode(e)?.getEdges()).toEqual([]);
  });

  it("does not add an edge if the to node is missing", () => {
    const graph = new Graph<string>();

    const c = graph.addNode("C4");

    graph.insertEdge(c, 999, 0.75);

    expect(graph.getNode(c)?.getEdges()).toEqual([]);
  });

  it("removes an edge", () => {
    const graph = new Graph<string>();

    const c = graph.addNode("C4");
    const e = graph.addNode("E4");

    graph.insertEdge(c, e, 0.75);
    graph.removeEdge(c, e);

    expect(graph.getNode(c)?.getEdges()).toEqual([]);
  });

  it("removes a node", () => {
    const graph = new Graph<string>();

    const c = graph.addNode("C4");

    graph.removeNode(c);

    expect(graph.getNode(c)).toBeUndefined();
  });

  it("removes edges pointing to a removed node", () => {
    const graph = new Graph<string>();

    const c = graph.addNode("C4");
    const e = graph.addNode("E4");
    const g = graph.addNode("G4");

    graph.insertEdge(c, e, 0.75);
    graph.insertEdge(g, e, 0.5);

    graph.removeNode(e);

    expect(graph.getNode(c)?.getEdges()).toEqual([]);
    expect(graph.getNode(g)?.getEdges()).toEqual([]);
  });

  it("does nothing when removing an edge that does not exist", () => {
    const graph = new Graph<string>();

    const c = graph.addNode("C4");
    const e = graph.addNode("E4");

    // Should not throw
    graph.removeEdge(c, e);

    expect(graph.getNode(c)?.getEdges()).toEqual([]);
  });

  it("does nothing when removing an edge using missing node ids", () => {
    const graph = new Graph<string>();

    const c = graph.addNode("C4");

    // Should not throw
    graph.removeEdge(c, 999);
    graph.removeEdge(999, c);

    expect(graph.getNode(c)?.getEdges()).toEqual([]);
  });

  it("does nothing when removing a missing node id", () => {
    const graph = new Graph<string>();

    const c = graph.addNode("C4");

    // Should not throw
    graph.removeNode(999);

    expect(graph.getNode(c)?.value).toBe("C4");
  });

  it("does not create duplicate edges when the same edge is inserted twice", () => {
    const graph = new Graph<string>();

    const c = graph.addNode("C4");
    const e = graph.addNode("E4");

    graph.insertEdge(c, e, 0.25);
    graph.insertEdge(c, e, 0.9);

    const edges = graph.getNode(c)?.getEdges();

    expect(edges).toHaveLength(1);
    expect(edges?.[0].from_node).toBe(c);
    expect(edges?.[0].to_node).toBe(e);
    // Current behavior: second insert is ignored (weight does not change)
    expect(edges?.[0].weight).toBe(0.25);
  });

  it("does not remove unrelated edges when a node is removed", () => {
    const graph = new Graph<string>();

    const a = graph.addNode("A4");
    const b = graph.addNode("B4");
    const c = graph.addNode("C5");
    const d = graph.addNode("D5");

    graph.insertEdge(a, b, 0.1);
    graph.insertEdge(c, d, 0.2);
    graph.insertEdge(d, c, 0.3);

    graph.removeNode(b);

    // Edge A->B removed because B removed
    expect(graph.getNode(a)?.getEdges()).toEqual([]);

    // Other edges remain
    const cEdges = graph.getNode(c)?.getEdges();
    const dEdges = graph.getNode(d)?.getEdges();
    expect(cEdges).toHaveLength(1);
    expect(cEdges?.[0].to_node).toBe(d);
    expect(dEdges).toHaveLength(1);
    expect(dEdges?.[0].to_node).toBe(c);
  });

  it("keeps allocating new node ids even after removals", () => {
    const graph = new Graph<string>();

    const a = graph.addNode("A4");
    const b = graph.addNode("B4");
    const c = graph.addNode("C5");

    graph.removeNode(b);

    const d = graph.addNode("D5");

    expect(a).toBe(0);
    expect(b).toBe(1);
    expect(c).toBe(2);
    expect(d).toBe(3);
  });
});
