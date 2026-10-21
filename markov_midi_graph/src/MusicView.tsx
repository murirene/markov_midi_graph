import { useEffect, useReducer, useRef, useState } from "react"
import graphReducer from "./graphReducer"
import Graph from "./datastructure/Graph"
import Note from "./Note.tsx"

export function MusicView() {
  const [viewWidth, setViewWidth] = useState<number>(window.innerWidth)
  const [viewHeight, setViewHeight] = useState<number>(window.innerHeight)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [viewColor] = useState<number>(0)

  const [state, dispatch] = useReducer(graphReducer, {}, () => {
    const g = new Graph<string>()
    return { MidiGraph: g }
  })

  useEffect(() => {
    const handleViewResize = () => {
      setViewWidth(window.innerWidth)
      setViewHeight(window.innerHeight)
    }

    handleViewResize()
    window.addEventListener("resize", handleViewResize)

    return () => {
      window.removeEventListener("resize", handleViewResize)
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      width={viewWidth}
      height={viewHeight}
      style={{ display: "block" }}
    >
      <rect
        x="0"
        y="0"
        width={viewWidth}
        height={viewHeight}
        fill={`hsl(${viewColor}, 100%, 50%)`}
        onClick={(event) => {
          dispatch({
            type: "add node",
            coordinate: { x: event.clientX, y: event.clientY },
          })
        }}
      />
      {state.MidiGraph.getNodes().map((n) => (
        <Note key={`note_${n.nodeId}`} coordinate={{ ...n.coordinate }} />
      ))}
    </svg>
  )
}
