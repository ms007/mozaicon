import { useCallback } from 'react'
import { useAtomValue } from 'jotai'
import { useAtomCallback } from 'jotai/utils'

import { canvasSelectedItemsAtom, canvasItemsAtomFamily } from '@/atoms/canvas'

const snapToGrid = (shape) => {
  return {
    ...shape,
    x: Math.round(shape.x),
    y: Math.round(shape.y),
  }
}

export function useSelectedItemsMove(id) {
  const selectedItems = useAtomValue(canvasSelectedItemsAtom)

  const updateSelectedItems = useAtomCallback(
    useCallback(
      (get, set) =>
        (position, options = {}) => {
          const currentShape = get(canvasItemsAtomFamily(id))

          selectedItems.forEach((itemId) =>
            set(canvasItemsAtomFamily(itemId), (state) => {
              const { stroke } = state

              const offset = {
                x: currentShape.x - state.x,
                y: currentShape.y - state.y,
              }

              // x and y are affected by border width
              const x = position.x - offset.x - (stroke?.width || 0) / 2
              const y = position.y - offset.y - (stroke?.width || 0) / 2

              const shape = { ...state, x, y }
              return options.snapToGrid ? snapToGrid(shape) : shape
            })
          )
        },
      [id, selectedItems]
    )
  )

  return (...args) => updateSelectedItems()(...args)
}
