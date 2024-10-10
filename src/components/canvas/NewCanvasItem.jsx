import { useState, useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { useKey } from 'react-use'

import { useCanvasItemCreate } from '@/hooks/useCanvasItemCreate'
import { canvasCreateCanvasItem } from '@/atoms/canvas'
import { subscribe, unsubscribe } from '@/utils/event'

export function NewCanvasItem({ toggleCursor }) {
  const [isCreating, setIsCreating] = useState(false)
  const [type, setType] = useState(null)
  const [newItem, setNewItem] = useState(null)
  const createNewCanvasItem = useSetAtom(canvasCreateCanvasItem)

  useKey('Escape', () => reset())

  useEffect(() => {
    subscribe('onCreateCanvasItem', ({ detail }) => {
      setIsCreating(true)
      setType(detail.type)
      toggleCursor(detail.type)
    })

    return () => unsubscribe('onCreateCanvasItem')
  }, [toggleCursor])

  const reset = () => {
    setIsCreating(false)
    setNewItem(null)
    setType(null)
    toggleCursor(null)
  }

  const addNewCanvasItem = (canvasItem) => {
    createNewCanvasItem(canvasItem)
    reset()
  }

  useCanvasItemCreate(isCreating, ({ status, position }) => {
    if (status === 'start') {
      const x = Math.round(position.x)
      const y = Math.round(position.y)
      setNewItem({
        origin: { x, y },
        x,
        y,
        width: 0,
        height: 0,
      })
    }

    if (status === 'moving') {
      const { x, y } = position
      const { origin } = newItem

      const width = x - origin.x
      const height = y - origin.y

      const absoluteWidth = Math.abs(width)
      const absoluteHeight = Math.abs(height)

      setNewItem({
        ...newItem,
        x: width < 0 ? origin.x - absoluteWidth : origin.x,
        y: height < 0 ? origin.y - absoluteHeight : origin.y,
        width: absoluteWidth,
        height: absoluteHeight,
      })
    }

    if (status === 'end') {
      addNewCanvasItem({
        type,
        x: Math.round(newItem.x),
        y: Math.round(newItem.y),
        width: Math.round(newItem.width),
        height: Math.round(newItem.height),
      })
    }
  })

  if (newItem == null) {
    return null
  }

  const { x, y, width, height } = newItem
  return <rect x={x} y={y} width={width} height={height} />
}
