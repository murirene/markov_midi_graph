import {useEffect, useState} from "react"
import {timer} from "d3"

type MusicCompositionProps = { fill:string }
type MusicPoint = { x: number, y: number }

const MusicComposition = ({fill}: MusicCompositionProps) => {
  const [pos, setPos] = useState<MusicPoint>({x: 400, y: 300})

  useEffect(() => {
    const animation = timer((elapsed) => {
      const x = 400 + Math.cos(elapsed / 700) * 120
      const y = 300 + Math.sin(elapsed / 900) * 90

      setPos({x,y})
    })

    return () => animation.stop()
  }, [])

  return (<circle cx={pos.x} cy={pos.y} r="100" fill={`hsl(${fill}, 100%, 50%)`} />)
}


export default MusicComposition
