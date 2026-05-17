import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

import { type Rect, rectEqual, unionRects } from '@/lib/geometry/rect'
import { bboxOf } from '@/lib/svg/bbox'
import { draftShapeAtom } from '@/store/atoms/draft'
import { marqueeDraftAtom } from '@/store/atoms/marquee-draft'
import { moveDraftAtom } from '@/store/atoms/move-draft'
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

// Folds in the draw-draft so resize handles appear live during drag-to-draw
// (Figma parity). `selectAtom(rectEqual)` below keeps identical-rect frames
// from re-rendering overlay + handles at gesture rate.
const rawDisplayedSelectionBboxAtom = atom((get) => {
  if (get(marqueeDraftAtom) !== null) return null
  if (get(moveDraftAtom) !== null) return null
  const resizing = get(resizeDraftAtom)
  if (resizing) return unionRects(Object.values(resizing))
  const drawing = get(draftShapeAtom)
  if (drawing) return bboxOf(drawing)
  return get(selectionBboxAtom)
})

export const displayedSelectionBboxAtom = selectAtom(
  rawDisplayedSelectionBboxAtom,
  (bbox) => bbox,
  rectEqual,
)
