import { useStore } from 'jotai'
import { useCallback } from 'react'

import { selectedIdsAtom } from '@/store/atoms/selection'

export function useClickToSelect(shapeId: string) {
  const store = useStore()

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return

      e.stopPropagation()

      const currentIds = store.get(selectedIdsAtom)

      if (e.shiftKey) {
        if (currentIds.includes(shapeId)) {
          store.set(
            selectedIdsAtom,
            currentIds.filter((id) => id !== shapeId),
          )
        } else {
          store.set(selectedIdsAtom, [...currentIds, shapeId])
        }
      } else {
        store.set(selectedIdsAtom, [shapeId])
      }
    },
    [store, shapeId],
  )

  return { onPointerDown }
}
