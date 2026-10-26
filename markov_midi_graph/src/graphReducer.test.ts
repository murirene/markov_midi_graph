import { expect, describe, it } from "vitest"
import graphReducer, { type MidiState, type MidiAction } from "./graphReducer"
import Graph from "./datastructure/Graph"

describe("graphReducer", () => {
  // add node action test
  it("Add node action", () => {
    const midiGraph = new Graph<string>()
    const midiState = { midiGraph }
    const midiAction = { type: "add node", coordinate: { x: 0, y: 1 } }
    const newState = graphReducer(midiState, midiAction)
    const nodes = newState.midiGraph.getNodes()

    expect(nodes.length).toBe(1)
    expect(nodes[0].coordinate).toEqual({ x: 0, y: 1 })
  })

  // invalid action
  it("invalid state", () => {
    const midiGraph = new Graph<string>()
    const midiState = { midiGraph }
    const midiAction = { type: "not real", coordinate: { x: 0, y: 2 } }

    expect(() => graphReducer(midiState, midiAction).toThrow("Unknown state"))
  })
})
