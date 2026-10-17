import { useState } from "react"
import Graph from "./datastructure/Graph"

const MusicComposition = () => {
  const [midiGraph] = useState(() => new Graph<string>())

  return (
    <div>
      {midiGraph.isEmpty() ? "Empty graph" : "not Empty"} nodes in the Graph
    </div>
  )
}

export default MusicComposition
