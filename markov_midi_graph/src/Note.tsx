import { type Coordinate } from "./datastructure/Node"

type NoteProp = {
  coordinate: Coordinate
  onSelected: () => void
  color: string
}

export default function Note(props: NoteProp) {
  return (
    <circle
      cx={props.coordinate.x}
      cy={props.coordinate.y}
      r="50"
      fill={props.color}
      onClick={() => props.onSelected()}
    />
  )
}
