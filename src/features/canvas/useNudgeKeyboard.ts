import { useStore } from 'jotai'
import { useEffect } from 'react'

import { isEditableTarget } from '@/features/shortcuts/match'
import { isSelectable } from '@/lib/selection'
import { shapeAtom } from '@/store/atoms/document'
import { anyGestureDraftActiveAtom } from '@/store/atoms/gestures/registry'
import { nudgeDraftAtom } from '@/store/atoms/nudge-draft'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { moveSelectionCommand } from '@/store/commands/moveSelection'

const ARROW_DELTAS: Partial<Record<string, { dx: number; dy: number }>> = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
}

export function useNudgeKeyboard(): void {
  const store = useStore()

  useEffect(() => {
    const pressed = new Set<string>()
    let runIds: string[] | null = null
    let dx = 0
    let dy = 0

    function commit() {
      if (runIds === null) return

      const commitIds = runIds
      const commitDx = dx
      const commitDy = dy

      runIds = null
      dx = 0
      dy = 0
      pressed.clear()

      store.set(nudgeDraftAtom, null)

      if (commitDx !== 0 || commitDy !== 0) {
        store.set(moveSelectionCommand, { ids: commitIds, dx: commitDx, dy: commitDy })
      }
    }

    function cancel() {
      if (runIds === null) return

      runIds = null
      dx = 0
      dy = 0
      pressed.clear()

      store.set(nudgeDraftAtom, null)
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return

      if (e.key === 'Escape' && runIds !== null) {
        cancel()
        return
      }

      const delta = ARROW_DELTAS[e.key]
      if (!delta) return

      if (runIds === null) {
        if (store.get(anyGestureDraftActiveAtom)) return
        const ids = store.get(selectedIdsAtom).filter((id) => {
          const s = store.get(shapeAtom(id))
          return s && isSelectable(s)
        })
        if (ids.length === 0) return
        runIds = ids
      }

      e.preventDefault()

      const scale = e.shiftKey ? 10 : e.altKey ? 0.1 : 1

      pressed.add(e.key)
      dx += delta.dx * scale
      dy += delta.dy * scale

      store.set(nudgeDraftAtom, { ids: runIds, dx, dy })
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (!(e.key in ARROW_DELTAS)) return

      pressed.delete(e.key)

      if (pressed.size === 0) commit()
    }

    function handleBlur() {
      cancel()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') cancel()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [store])
}
