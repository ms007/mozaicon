import { atom } from 'jotai'

import { canvasSelectedItemsAtom, canvasHoveredItemAtom } from '@/atoms/canvas'
import { sidebarItemsAtom, sidebarDraggedItemAtom, sidebarEditingItemAtom } from '../atoms'

export const sidebarSelectedItemsSortedAtom = atom((get) => {
  const selectedItems = get(canvasSelectedItemsAtom)
  const canvasItems = get(sidebarItemsAtom)

  return selectedItems.slice().sort((id1, id2) => {
    const index1 = canvasItems.findIndex((item) => item === id1)
    const index2 = canvasItems.findIndex((item) => item === id2)

    return index1 - index2
  })
})

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
