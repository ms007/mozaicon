import { atom } from 'jotai'

import { canvasItemsAtom, canvasSelectedItemsAtom, canvasHoveredItemAtom } from '../canvas'
import { sidebarDraggedItemAtom, sidebarEditingItemAtom } from './atoms'

export const sidebarItemsAtom = atom(
  (get) => {
    const canvasItems = get(canvasItemsAtom)
    return [...canvasItems].reverse()
  },
  (_, set, items) => {
    set(canvasItemsAtom, [...items].reverse())
  }
)

export const sidebarHoveredItemAtom = atom(
  (get) => {
    const selectedItems = get(canvasSelectedItemsAtom)
    const hoveredItem = get(canvasHoveredItemAtom)

    if (hoveredItem == null) {
      return null
    }

    // do not hover if already selected
    const isSelectedItem = selectedItems.some((item) => item === hoveredItem)
    return isSelectedItem ? null : hoveredItem
  },
  (get, set, id) => {
    const draggedItem = get(sidebarDraggedItemAtom)
    const selectedItems = get(canvasSelectedItemsAtom)

    if (id == null) {
      set(canvasHoveredItemAtom, null)
    }

    if (draggedItem != null || selectedItems.includes(id)) {
      return
    }

    set(canvasHoveredItemAtom, id)
  }
)

export const sidebarItemDraggingConstraints = (id) => {
  const sidebarItemDraggingConstraints = atom((get) => {
    const defaultValues = {
      canDropBefore: false,
      canDropAfter: false,
    }

    if (id == null) {
      return defaultValues
    }

    const canvasItems = get(sidebarItemsAtom)
    const draggedItem = get(sidebarDraggedItemAtom)

    const count = canvasItems.length
    if (draggedItem == null || count < 2) {
      return defaultValues
    }

    const draggingIndex = canvasItems.indexOf(draggedItem)
    const hoveredIndex = canvasItems.indexOf(id)

    const canDropBefore = !(draggingIndex === hoveredIndex || draggingIndex + 1 === hoveredIndex)
    const canDropAfter = !(draggingIndex === hoveredIndex || draggingIndex - 1 === hoveredIndex)

    return {
      canDropBefore,
      canDropAfter,
    }
  })
  return sidebarItemDraggingConstraints
}

export const sidebarNextItemAtom = atom((get) => {
  const editingId = get(sidebarEditingItemAtom)
  if (editingId == null) {
    return null
  }

  const canvasItems = get(sidebarItemsAtom)
  const count = canvasItems.length
  if (count < 2) {
    return null
  }

  const index = canvasItems.indexOf(editingId)
  return canvasItems[index === count - 1 ? 0 : index + 1]
})

export const sidebarPrevItemAtom = atom((get) => {
  const editingId = get(sidebarEditingItemAtom)
  if (editingId == null) {
    return null
  }

  const canvasItems = get(sidebarItemsAtom)
  const count = canvasItems.length
  if (count < 2) {
    return null
  }

  const index = canvasItems.indexOf(editingId)
  return canvasItems[index === 0 ? count - 1 : index - 1]
})

export const sidebarBoxBorderRadius = (id) => {
  const sidebarBoxBorderRadius = atom((get) => {
    const borderRadius = {
      borderTopLeftRadius: '4px',
      borderTopRightRadius: '4px',
      borderBottomLeftRadius: '4px',
      borderBottomRightRadius: '4px',
    }

    const canvasItems = get(sidebarItemsAtom)
    const selectedCanvasItems = get(canvasSelectedItemsAtom)
    if (canvasItems.length < 2 || selectedCanvasItems < 2) {
      return borderRadius
    }

    const indexOfCurrentItem = canvasItems.indexOf(id)

    const hasPreviousItem = indexOfCurrentItem - 1 >= 0
    const isPreviousItemSelected = hasPreviousItem
      ? selectedCanvasItems.some((item) => item === canvasItems[indexOfCurrentItem - 1])
      : false

    const hasNextItem = indexOfCurrentItem + 1 <= canvasItems.length
    const isNextItemSelected = hasNextItem
      ? selectedCanvasItems.some((item) => item === canvasItems[indexOfCurrentItem + 1])
      : false

    if (isPreviousItemSelected) {
      borderRadius.borderTopLeftRadius = 0
      borderRadius.borderTopRightRadius = 0
    }

    if (isNextItemSelected) {
      borderRadius.borderBottomLeftRadius = 0
      borderRadius.borderBottomRightRadius = 0
    }

    return borderRadius
  })
  return sidebarBoxBorderRadius
}
