import { useEffect, useReducer, useRef, useState } from "react"
import { forceSimulation, forceCollide, type Simulation } from "d3-force"
import graphReducer from "./graphReducer"
import Graph from "./datastructure/Graph"
import Note from "./Note.tsx"
import { type Coordinate } from "./datastructure/Node"

type DisplayNode = {
  nodeId: number
  x: number
  y: number
}

export function MusicView() {
  const [viewWidth, setViewWidth] = useState<number>(window.innerWidth)
  const [viewHeight, setViewHeight] = useState<number>(window.innerHeight)
  const [selectedNodeId, setSelectedNodeId] = useState<number>(-1)
  const [displayNodes, setDisplayNodes] = useState<Map<number, Coordinate>>(
    new Map(),
  )
  const svgRef = useRef<SVGSVGElement | null>(null)
  const simulationRef = useRef<Simulation<DisplayNode, undefined> | null>(null)
  const [viewColor] = useState<number>(0)

  const [state, dispatch] = useReducer(graphReducer, {}, () => {
    const g = new Graph<string>()
    return { midiGraph: g }
  })

  // add and dislodge resize listeners for window changes
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

  useEffect(() => {
    if (simulationRef.current == null) return

    simulationRef.current.alpha(1).restart()
  }, [viewWidth, viewHeight])

  // Create the collision simulation when this component mounts
  useEffect(() => {
    simulationRef.current = forceSimulation<DisplayNode>([])
      .force("collide", forceCollide(55))
      .on("tick", () => {
        const svg = svgRef.current
        if (svg == null) return

        const nodes = simulationRef.current?.nodes() ?? []
        const xMin = 50
        const yMin = 50
        const xMax = svg.width.baseVal.value - 50
        const yMax = svg.height.baseVal.value - 50

        for (let n of nodes) {
          if (n.x < xMin) n.x = xMin
          if (n.x > xMax) n.x = xMax
          if (n.y < yMin) n.y = yMin
          if (n.y > yMax) n.y = yMax
        }

        setDisplayNodes(
          new Map<number, Coordinate>(
            nodes.map(({ nodeId, x, y }) => [nodeId, { x, y }]),
          ),
        )
      })

    return () => {
      simulationRef.current?.stop()
    }
  }, [])

  // when the graph updateas, apply the collision force
  useEffect(() => {
    if (simulationRef.current === null) return

    const midiNodes = state.midiGraph
      .getNodes()
      .map(({ nodeId, coordinate }) => ({ nodeId, ...coordinate }))

    const simNodeMap = new Map<number, DisplayNode>(
      (simulationRef.current?.nodes() ?? []).map((simNode) => [
        simNode.nodeId,
        simNode,
      ]),
    )

    const updatedSimNodes = midiNodes.map((node) => {
      if (!simNodeMap.has(node.nodeId)) {
        return node
      }

      return simNodeMap.get(node.nodeId) ?? node
    })

    simulationRef.current.nodes(updatedSimNodes).alpha(1).restart()
  }, [state.midiGraph])

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
          console.log("rect was clicked")
          dispatch({
            type: "add node",
            coordinate: { x: event.clientX, y: event.clientY },
          })
        }}
      />
      {state.midiGraph.getNodes().map((n) => (
        <Note
          key={n.nodeId}
          coordinate={{ ...(displayNodes.get(n.nodeId) ?? n.coordinate) }}
          onSelected={() => setSelectedNodeId(n.nodeId)}
          isSelected={selectedNodeId === n.nodeId}
        />
      ))}
    </svg>
  )
}
