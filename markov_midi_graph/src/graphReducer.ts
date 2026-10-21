import Graph from "./datastructure/Graph"
import { type Coordinate } from "./datastructure/Node"

type MidiState = {
  MidiGraph: Graph<string>
}

type MidiAction = { type: "add node"; coordinate: Coordinate }

export default function graphReducer(
  state: MidiState,
  action: MidiAction,
): MidiState {
  switch (action.type) {
    case "add node": {
      const newGraph = state.MidiGraph.clone()
      return { MidiGraph: newGraph.addNode("", { ...action.coordinate }) }
    }

    default:
      throw Error("Unknown state")
  }
}
