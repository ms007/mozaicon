import { atom } from 'jotai'

import { canvasItemsAtomFamily, canvasSelectedItemsAtom } from './atoms'
import { getCoordinates } from './helper/coordinatesHelper'

const canvasSelectedItems = atom((get) => {
  const selectedItems = get(canvasSelectedItemsAtom)
  if (selectedItems.length < 1) {
    return []
  }

  return selectedItems.map((id) => {
    return get(canvasItemsAtomFamily(id))
  })
})

export const canvasCanvasItemCoordinates = (id) => {
  const canvasCanvasItemCoordinates = atom((get) => {
    if (id == null) {
      return {}
    }

    const canvasItem = get(canvasItemsAtomFamily(id))
    const { x, y, width, height } = canvasItem
    return getCoordinates(x, y, width, height)
  })
  return canvasCanvasItemCoordinates
}

export const canvasSelectedCanvasItemsCoordinats = atom((get) => {
  const selectedItems = get(canvasSelectedItems)
  if (selectedItems.length < 1) {
    return null
  }

  const selectedItemsCoordinates = selectedItems.map((item) => {
    const { x, y, width, height } = item
    const topLeft = [x, y]
    const topRight = [x + width, y]
    const bottomLeft = [x, y + height]
    const bottomRight = [x + width, y + height]
    return { topLeft, topRight, bottomLeft, bottomRight }
  })

  const minTopLeftPosition = selectedItemsCoordinates.reduce(
    (current, { topLeft }) => {
      const [currentX, currentY] = current
      const [topLeftX, topLeftY] = topLeft

      return [Math.min(currentX, topLeftX), Math.min(currentY, topLeftY)]
    },
    [1000, 1000]
  )

  const maxBottomRightPosition = selectedItemsCoordinates.reduce(
    (current, { bottomRight }) => {
      const [currentX, currentY] = current
      const [bottomRightX, bottomRightY] = bottomRight

      return [Math.max(currentX, bottomRightX), Math.max(currentY, bottomRightY)]
    },
    [-1000, -1000]
  )

  const x = minTopLeftPosition[0]
  const y = minTopLeftPosition[1]
  const width = maxBottomRightPosition[0] - x
  const height = maxBottomRightPosition[1] - y

  return getCoordinates(x, y, width, height)
})

export const canvasSelectionGripCords = atom((get) => {
  const coordinates = get(canvasSelectedCanvasItemsCoordinats)
  if (coordinates == null) {
    return null
  }

  const {
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
    topCenter,
    bottomCenter,
    leftCenter,
    rightCenter,
  } = coordinates

  return {
    nw: [topLeft.x, topLeft.y],
    ne: [topRight.x, topRight.y],
    sw: [bottomLeft.x, bottomLeft.y],
    se: [bottomRight.x, bottomRight.y],
    n: [topCenter.x, topCenter.y],
    w: [leftCenter.x, leftCenter.y],
    e: [rightCenter.x, rightCenter.y],
    s: [bottomCenter.x, bottomCenter.y],
  }
})
