import { useMemo } from 'react'
import { useAtomValue } from 'jotai'

import { Border } from './border'
import { canvasHoveredItemAtom, canvasCanvasItemCoordinates } from '@/atoms/canvas'

export default function Hover() {
  const hoveredItem = useAtomValue(canvasHoveredItemAtom)
  const coordinates = useAtomValue(
    useMemo(() => canvasCanvasItemCoordinates(hoveredItem), [hoveredItem])
  )

  if (hoveredItem == null) {
    return null
  }

  return <Border coordinates={coordinates} />
}
