import { useCallback } from 'react'
import { useAtom } from 'jotai'
import { useAtomCallback } from 'jotai/utils'

import { canvasItemsAtomFamily, canvasSelectedItemsAtom } from '@/atoms/canvas'

const calculateHeight = (shape, selection, position, direction) => {
  const proportion = shape.height / selection.height
  switch (direction) {
    case 'n':
    case 'nw':
    case 'ne':
      return (selection.bottomCenter.y - position.y) * proportion
    case 's':
    case 'sw':
    case 'se':
      return (position.y - selection.topCenter.y) * proportion
    default:
      throw new Error('Not valid case for height calculation')
  }
}

const calculateWidth = (shape, selection, position, direction) => {
  const proportion = shape.width / selection.width
  switch (direction) {
    case 'e':
    case 'ne':
    case 'se':
      return (position.x - selection.leftCenter.x) * proportion
    case 'w':
    case 'nw':
    case 'sw':
      return (selection.rightCenter.x - position.x) * proportion
    default:
      throw new Error('Not valid case for width calculation')
  }
}

const calculateX = (shape, selection, position, direction) => {
  const proportion = (shape.x - selection.leftCenter.x) / selection.width
  switch (direction) {
    case 'e':
    case 'ne':
    case 'se':
      return selection.leftCenter.x + (position.x - selection.leftCenter.x) * proportion
    case 'w':
    case 'nw':
    case 'sw':
      return position.x + (selection.rightCenter.x - position.x) * proportion
    default:
      throw new Error('Not valid case for width calculation')
  }
}

const calculateY = (shape, selection, position, direction) => {
  const proportion = (shape.y - selection.topCenter.y) / selection.height
  switch (direction) {
    case 'n':
    case 'nw':
    case 'ne':
      return position.y + (selection.bottomCenter.y - position.y) * proportion
    case 's':
    case 'se':
    case 'sw':
      return selection.topCenter.y + (position.y - selection.topCenter.y) * proportion
    default:
      throw new Error('Not valid case for y calculation')
  }
}

const snapToGrid = (shape) => {
  return {
    ...shape,
    x: Math.round(shape.x),
    y: Math.round(shape.y),
    height: Math.max(Math.round(shape.height), 1),
    width: Math.max(Math.round(shape.width), 1),
  }
}

export function useSelectedItemsResize() {
  const [selectedItems] = useAtom(canvasSelectedItemsAtom)

  const updateSelectedItems = useAtomCallback(
    useCallback(
      (_, set) =>
        (direction, position, coordinates, options = {}) => {
          selectedItems.forEach((id) => {
            set(canvasItemsAtomFamily(id), (state) => {
              let shape = state
              switch (direction) {
                case 'nw':
                  if (
                    position.x <= coordinates.rightCenter.x &&
                    position.y <= coordinates.bottomCenter.y
                  ) {
                    const height = calculateHeight(state, coordinates, position, direction)
                    const width = calculateWidth(state, coordinates, position, direction)
                    const x = calculateX(state, coordinates, position, direction)
                    const y = calculateY(state, coordinates, position, direction)
                    shape = { ...state, height, width, x, y }
                  }
                  break

                case 'n':
                  if (position.y <= coordinates.bottomCenter.y) {
                    const height = calculateHeight(state, coordinates, position, direction)
                    const y = calculateY(state, coordinates, position, direction)
                    shape = { ...state, height, y }
                  }
                  break

                case 'ne':
                  if (
                    position.x >= coordinates.leftCenter.x &&
                    position.y <= coordinates.bottomCenter.y
                  ) {
                    const height = calculateHeight(state, coordinates, position, direction)
                    const width = calculateWidth(state, coordinates, position, direction)
                    const x = calculateX(state, coordinates, position, direction)
                    const y = calculateY(state, coordinates, position, direction)
                    shape = { ...state, height, width, x, y }
                  }
                  break

                case 'e':
                  if (position.x >= coordinates.leftCenter.x) {
                    const width = calculateWidth(state, coordinates, position, direction)
                    const x = calculateX(state, coordinates, position, direction)
                    shape = { ...state, width, x }
                  }
                  break

                case 'se':
                  if (
                    position.y >= coordinates.topCenter.y &&
                    position.x >= coordinates.leftCenter.x
                  ) {
                    const height = calculateHeight(state, coordinates, position, direction)
                    const width = calculateWidth(state, coordinates, position, direction)
                    const x = calculateX(state, coordinates, position, direction)
                    const y = calculateY(state, coordinates, position, direction)
                    shape = { ...state, height, width, x, y }
                  }
                  break

                case 's':
                  if (position.y >= coordinates.topCenter.y) {
                    const height = calculateHeight(state, coordinates, position, direction)
                    const y = calculateY(state, coordinates, position, direction)
                    shape = { ...state, height, y }
                  }
                  break

                case 'sw':
                  if (
                    position.x <= coordinates.rightCenter.x &&
                    position.y >= coordinates.topCenter.y
                  ) {
                    const width = calculateWidth(state, coordinates, position, direction)
                    const height = calculateHeight(state, coordinates, position, direction)
                    const x = calculateX(state, coordinates, position, direction)
                    const y = calculateY(state, coordinates, position, direction)
                    shape = { ...state, width, height, x, y }
                  }
                  break

                case 'w':
                  if (position.x <= coordinates.rightCenter.x) {
                    const width = calculateWidth(state, coordinates, position, direction)
                    const x = calculateX(state, coordinates, position, direction)
                    shape = { ...state, width, x }
                  }
                  break

                default:
              }

              return options.snapToGrid ? snapToGrid(shape) : shape
            })
          })
        },
      [selectedItems]
    )
  )

  return (...args) => updateSelectedItems()(...args)
}
