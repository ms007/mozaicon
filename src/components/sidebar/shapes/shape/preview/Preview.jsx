import { useAtomValue } from 'jotai'

import { Rectangle } from './previews'
import { canvasItemsAtomFamily } from '@/atoms/canvas'

export default function Preview({ id }) {
  const shape = useAtomValue(canvasItemsAtomFamily(id))
  const { type } = shape

  if (type === 'rectangle') {
    return <Rectangle {...shape} size={10} />
  }

  return null
}
