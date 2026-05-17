import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

export type MoveDraft = {
  ids: string[]
  dx: number
  dy: number
}

const moveDraftValueAtom = atom<MoveDraft | null>(null)

// Writable wrapper that bails out when (dx, dy, ids ref) are unchanged so
// pointer jitter inside the same viewBox coordinate does not re-render every
// selected shape at gesture rate.
export const moveDraftAtom = atom(
  (get) => get(moveDraftValueAtom),
  (get, set, next: MoveDraft | null) => {
    const prev = get(moveDraftValueAtom)
    if (prev === next) return
    if (prev !== null && next !== null) {
      if (prev.dx === next.dx && prev.dy === next.dy && prev.ids === next.ids) return
    }
    set(moveDraftValueAtom, next)
  },
)

export const moveDraftForShapeAtom = atomFamily((id: string) =>
  selectAtom(
    moveDraftAtom,
    (draft) => (draft?.ids.includes(id) ? { dx: draft.dx, dy: draft.dy } : null),
    (a, b) => {
      if (a === b) return true
      if (a === null || b === null) return false
      return a.dx === b.dx && a.dy === b.dy
    },
  ),
)
