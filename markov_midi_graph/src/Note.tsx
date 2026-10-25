import { type Coordinate } from "./datastructure/Node"

type NoteProp = {
  coordinate: Coordinate
  isSelected: boolean
  onSelected: () => void
}

export default function Note(props: NoteProp) {
  return (
    <circle
      cx={props.coordinate.x}
      cy={props.coordinate.y}
      r="50"
      fill={props.isSelected ? "hsl(51, 100%, 50%)" : "hsl(200, 50%, 100%)"}
      onClick={() => props.onSelected()}
    />
  )
}
