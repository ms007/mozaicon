import { useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'

import {
  canvasItemsAtomFamily,
  canvasIsCreatingNewItemAtom,
  canvasHoveredItemAtom,
} from '@/atoms/canvas'

import { useCanvasItemMove } from '@/hooks/useCanvasItemMove'
import { useCanvasItemSelect } from '@/hooks/useCanvasItemSelect'
import { useSelectedItemsMove } from '@/hooks/useSelectedItemsMove'
import { isSamePoint } from '@/utils'
import { createShape } from './shapes'

export function CanvasItem({ id }) {
  const [originalPointerPosition, setOriginalPointerPosition] = useState(null)
  const [isMoving, setIsMoving] = useState(false)
  const itemState = useAtomValue(canvasItemsAtomFamily(id))
  const isCreatingNewCanvasItem = useAtomValue(canvasIsCreatingNewItemAtom)
  const setHoveredCanvasItem = useSetAtom(canvasHoveredItemAtom)
  const moveSelectedItems = useSelectedItemsMove(id)
  const selectCanvasItem = useCanvasItemSelect()
  const noop = () => {}

  const { onMouseDown } = useCanvasItemMove(({ status, position, event }) => {
    if (status === 'start') {
      selectCanvasItem(id, { shiftKey: event.shiftKey })
      setOriginalPointerPosition(position)

      setIsMoving(true)
    }

    if (status === 'moving') {
      moveSelectedItems(position)
    }

    if (status === 'end') {
      if (!isSamePoint(originalPointerPosition, position)) {
        // ToDo: make snap to grid configurable?
        moveSelectedItems(position, { snapToGrid: true })
      }
      setIsMoving(false)
    }
  })

  const onClick = (event) => {
    event.stopPropagation()
  }

  const onMouseEnter = () => {
    setHoveredCanvasItem(id)
  }

  const onMouseLeave = () => {
    setHoveredCanvasItem(null)
  }

  const Shape = createShape(itemState)
  if (!Shape) {
    return null
  }

  return (
    <Shape
      {...itemState}
      onClick={onClick}
      onMouseDown={isCreatingNewCanvasItem ? noop : onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      selectable={!isCreatingNewCanvasItem}
      isMoving={isMoving}
    />
  )
}
