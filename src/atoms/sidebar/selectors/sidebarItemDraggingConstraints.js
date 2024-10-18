import { atom } from 'jotai'

import {
  sidebarItemsAtom,
  sidebarDraggedItemAtom,
  sidebarSelectedItemsSortedAtom,
} from '@/atoms/sidebar'

const getSelectedBlock = (canvasItems, selectedItems, draggindId) => {
  const startIndex = selectedItems.indexOf(draggindId)
  if (startIndex === -1) return [draggindId]

  return selectedItems
    .reduce((blocks, id) => {
      const index = canvasItems.indexOf(id)
      if (index !== -1) {
        const lastBlock = blocks[blocks.length - 1]
        if (!lastBlock || index !== canvasItems.indexOf(lastBlock[lastBlock.length - 1]) + 1) {
          blocks.push([id])
        } else {
          lastBlock.push(id)
        }
      }
      return blocks
    }, [])
    .find((block) => block.includes(draggindId))
}

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

    const selectedItems = get(sidebarSelectedItemsSortedAtom)
    const selectedBlock = getSelectedBlock(
      canvasItems,
      selectedItems.length > 1 ? selectedItems : [draggedItem],
      draggedItem
    )

    const draggingIndexStart = canvasItems.indexOf(selectedBlock.at(0))
    const draggingIndexEnd = canvasItems.indexOf(selectedBlock.at(-1))
    const hoveredIndex = canvasItems.indexOf(id)

    const canDropBefore = hoveredIndex < draggingIndexStart
    const canDropAfter = hoveredIndex > draggingIndexEnd

    return {
      canDropBefore,
      canDropAfter,
    }
  })
  return sidebarItemDraggingConstraints
}
