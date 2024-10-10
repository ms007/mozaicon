import { useMemo } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'

import { Border } from './border'
import { ResizeHandle } from './resizeHandle'
import {
  canvasIsResizingItemAtom,
  canvasSelectedCanvasItemsCoordinats,
  canvasSelectionGripCords,
} from '@/atoms/canvas'

import { useSelectedItemsResize } from '@/hooks/useSelectedItemsResize'

export default function Selection() {
  const coordinates = useAtomValue(canvasSelectedCanvasItemsCoordinats)
  const gripCoords = useAtomValue(canvasSelectionGripCords)
  const setIsResizing = useSetAtom(canvasIsResizingItemAtom)
  const resize = useSelectedItemsResize()

  if (coordinates == null) {
    return null
  }

  const onResizeStart = () => {
    setIsResizing(true)
  }

  const onResize = (direction, position) => {
    resize(direction, position, coordinates)
  }

  const onResizeEnd = (direction, position) => {
    // ToDo: Make snap to grid configurable?
    const options = { snapToGrid: true }
    resize(direction, position, coordinates, options)
    setTimeout(() => setIsResizing(false), 0)
  }

  return (
    <>
      <Border coordinates={coordinates} />

      {Object.keys(gripCoords).map((key) => {
        const [x, y] = gripCoords[key]
        return (
          <ResizeHandle
            key={key}
            direction={key}
            cx={x}
            cy={y}
            onResize={onResize}
            onResizeEnd={onResizeEnd}
            onResizeStart={onResizeStart}
          />
        )
      })}
    </>
  )
}
