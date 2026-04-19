import { useEffect, useRef, useState } from "react";
import MusicComposition from "./MusicComposition";
type Position = { x: number; y: number };

export function MusicView() {
  const [mousePosition, setMousePosition] = useState<Position>({ x: 0, y: 0 });
  const [viewWidth, setViewWidth] = useState<number>(window.innerWidth);
  const [viewHeight, setViewHeight] = useState<number>(window.innerHeight);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [viewColor, setViewColor] = useState<number>(0)

  useEffect(() => {
    const handleViewResize = () => {
      setViewWidth(window.innerWidth);
      setViewHeight(window.innerHeight);
    };
    const colorTimerId = setInterval(() => setViewColor((h =>(h + 1) % 360)), 40)

    handleViewResize();
    window.addEventListener("resize", handleViewResize);

    return () => { 
      window.removeEventListener("resize", handleViewResize)
      clearInterval(colorTimerId)
    }
  }, []);

  return (
    <svg ref={svgRef} width={viewWidth} height={viewHeight} style={{ display: "block" }}>
      <rect x="0" y="0" width={viewWidth} height={viewHeight} fill={`hsl(${viewColor}, 100%, 50%)`} />
      <MusicComposition fill={`${(viewColor + 180)%360}`} />
    </svg>
  );
}
