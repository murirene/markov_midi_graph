import { useState } from "react"
import Graph from "./datastructure/Graph"

const MusicComposition = () => {
  const [midiGraph, _] = useState(() => new Graph<string>())
  
  return <div>{midiGraph.isEmpty() ? "Empty graph": "not Empty"} nodes in the Graph</div>
}

export default MusicComposition
