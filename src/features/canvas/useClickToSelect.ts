import { useStore } from 'jotai'
import { useCallback } from 'react'

import { selectedIdsAtom } from '@/store/atoms/selection'
import { selectShapesCommand, toggleSelectionCommand } from '@/store/commands/selectionCommands'

export function useClickToSelect(shapeId: string) {
  const store = useStore()

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return

      e.stopPropagation()

      if (e.shiftKey) {
        store.set(toggleSelectionCommand, shapeId)
      } else {
        const currentIds = store.get(selectedIdsAtom)
        if (currentIds.length === 1 && currentIds[0] === shapeId) return
        store.set(selectShapesCommand, [shapeId])
      }
    },
    [store, shapeId],
  )

  return { onPointerDown }
}
