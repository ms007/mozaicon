import { useCallback } from 'react'
import { useAtom } from 'jotai'

import { canvasSelectedItemsAtom } from '@/atoms/canvas'

export function useCanvasItemSelect() {
  const [selectedItems, selectItems] = useAtom(canvasSelectedItemsAtom)

  return useCallback(
    (id, options = {}) => {
      const { shiftKey = false } = options

      if (!shiftKey && selectedItems.length <= 1) {
        selectItems([id])
        return
      }

      if (!shiftKey && selectedItems.length > 1) {
        if (!selectedItems.includes(id)) {
          selectItems([id])
        }
        return
      }

      if (selectedItems.includes(id)) {
        selectItems(selectedItems.filter((item) => item !== id))
        return
      }

      selectItems([...selectedItems, id])
    },
    [selectedItems, selectItems]
  )
}
