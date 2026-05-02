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
});
