import { useAtomValue } from 'jotai'

import { canvasItemsAtomFamily } from '@/atoms/canvas'

export function CanvasItem({ id }) {
  const state = useAtomValue(canvasItemsAtomFamily({ id }))
  console.log(state)

  const Shape = () => <rect x="2" y="2" width="2" height="2" />
  return <Shape />
}
