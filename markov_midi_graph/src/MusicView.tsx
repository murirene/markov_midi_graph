import { useEffect, useRef, useState } from "react"

type Position = { x: number, y: number }

export function MusicView() {
  const [mousePosition, setMousePosition] = useState<Position>({x:0, y:0})
  const [viewWidth, setViewWidth] = useState<number>(window.innerWidth)
  const [viewHeight, setViewHeight] = useState<number>(window.innerHeight)
  const svgRef = useRef<SVGSVGElement|null>(null)

  useEffect(() => {
    const handleViewResize = () => {
      setViewWidth(window.innerWidth)
      setViewHeight(window.innerHeight)
    }

    window.addEventListener("resize", handleViewResize)
    
    return () => window.removeEventListener("resize", handleViewResize)
  }, [])

  useEffect(() => console.log(`view width=${viewWidth}, height=${viewHeight}`), [viewWidth, viewHeight])


  return <svg ref={svgRef} width={viewWidth} height={viewHeight}></svg>  
}
