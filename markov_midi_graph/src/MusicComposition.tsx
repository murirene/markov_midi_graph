import {useEffect} from "react"

type MusicCompositionProps = { fill:string }

const MusicComposition = ({fill}: MusicCompositionProps) => {
  return (<circle cx="400" cy="400" r="100" fill={`hsl(${fill}, 100%, 50%)`} />)
}


export default MusicComposition
