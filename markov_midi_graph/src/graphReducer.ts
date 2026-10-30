import Graph from "./datastructure/Graph"
import { type Coordinate } from "./datastructure/Node"

export type MidiState = {
  midiGraph: Graph<string>
}

export type MidiAction =
  | { type: "add node"; coordinate: Coordinate }
  | { type: "load graph"; graph: Graph<string> }

export default function graphReducer(
  state: MidiState,
  action: MidiAction,
): MidiState {
  switch (action.type) {
    case "add node": {
      const newGraph = state.midiGraph.clone()
      return { midiGraph: newGraph.addNode("", { ...action.coordinate }) }
    }
    case "load graph": {
      return { midiGraph: action.graph }
    }

    default:
      throw Error("Unknown state")
  }
}
