import { useAtomValue } from 'jotai'

import { canvasItemsAtomFamily } from '@/atoms/canvas'

export function CanvasItem({ id }) {
  const state = useAtomValue(canvasItemsAtomFamily({ id }))
  const { x, y, width, height } = state

  const Shape = () => <rect x={x} y={y} width={width} height={height} />
  return <Shape />
}
