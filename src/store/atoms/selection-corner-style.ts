import { atom } from 'jotai'

import type { CornerStyle, RectShape } from '@/types/shapes'

import { selectedShapesAtom } from './selection'
import { type FieldValue, MIXED } from './selection-geometry'

export type SelectionCornerStyle = CornerStyle | typeof MIXED | null
export type SelectionSmoothing = FieldValue | null

export const selectionCornerStyleAtom = atom<SelectionCornerStyle>((get) => {
  const shapes = get(selectedShapesAtom)
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  const rects = shapes.filter((s): s is RectShape => s.type === 'rect')
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */

  if (rects.length === 0) return null

  const first = rects[0].corners.style
  for (let i = 1; i < rects.length; i++) {
    if (rects[i].corners.style !== first) return MIXED
  }
  return first
})

export const selectionSmoothingAtom = atom<SelectionSmoothing>((get) => {
  const shapes = get(selectedShapesAtom)
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  const rects = shapes.filter((s): s is RectShape => s.type === 'rect')
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */

  if (rects.length === 0) return null

  const first = rects[0].corners.smoothing
  for (let i = 1; i < rects.length; i++) {
    if (rects[i].corners.smoothing !== first) return MIXED
  }
  return first
})
