import { type Coordinate } from "./datastructure/Node"

type NoteProp = {
  coordinate: Coordinate
}

export default function Note(arg: NoteProp) {
  return <circle cx={arg.coordinate.x} cy={arg.coordinate.y} r="50" />
}
