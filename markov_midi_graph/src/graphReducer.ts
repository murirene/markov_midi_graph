import Graph from "./datastructure/Graph"
import { type Coordinate } from "./datastructure/Node"

type MidiState = {
  midiGraph: Graph<string>
}

type MidiAction = { type: "add node"; coordinate: Coordinate }

export default function graphReducer(
  state: MidiState,
  action: MidiAction,
): MidiState {
  switch (action.type) {
    case "add node": {
      const newGraph = state.midiGraph.clone()
      return { midiGraph: newGraph.addNode("", { ...action.coordinate }) }
    }

    default:
      throw Error("Unknown state")
  }
}
