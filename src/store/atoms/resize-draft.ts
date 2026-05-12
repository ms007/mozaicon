import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

import { type Rect, rectEqual, unionRects } from '@/lib/geometry/rect'
import { selectionBboxAtom } from '@/store/atoms/selection'

export const resizeDraftAtom = atom<Record<string, Rect> | null>(null)

// Per-shape slice so a draft update only re-renders shapes whose geometry
// actually changed — unselected shapes stay on `null` for the whole gesture.
// Mirrors the structural bail-out used by `selectionBboxAtom`.
export const resizeDraftForShapeAtom = atomFamily((id: string) =>
  selectAtom(
    resizeDraftAtom,
    (draft) => draft?.[id] ?? null,
    (a, b) => rectEqual(a, b),
  ),
)

// Overlay bbox: draft union during a resize, committed bbox at rest. Structural
// bail-out mirrors `selectionBboxAtom` so identical-rect frames don't re-render
// `SelectionOverlay` and `ResizeHandles` ~60×/s during a drag.
const rawDisplayedSelectionBboxAtom = atom((get) => {
  const draft = get(resizeDraftAtom)
  if (draft) return unionRects(Object.values(draft))
  return get(selectionBboxAtom)
})

export const displayedSelectionBboxAtom = selectAtom(
  rawDisplayedSelectionBboxAtom,
  (bbox) => bbox,
  rectEqual,
)
