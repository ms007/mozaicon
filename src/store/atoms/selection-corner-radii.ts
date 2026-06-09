import { atom } from 'jotai'

import type { RectShape } from '@/types/shapes'

import { selectedShapesAtom } from './selection'
import { type FieldValue, MIXED } from './selection-geometry'

export type SelectionCornerRadii = {
  hasRects: boolean
  tl: FieldValue
  tr: FieldValue
  br: FieldValue
  bl: FieldValue
}

function cornerValue(rects: readonly RectShape[], index: 0 | 1 | 2 | 3): FieldValue {
  const first = rectCorner(rects[0], index)
  for (let i = 1; i < rects.length; i++) {
    if (rectCorner(rects[i], index) !== first) return MIXED
  }
  return first
}

function rectCorner(shape: RectShape, index: 0 | 1 | 2 | 3): number {
  return shape.corners.radii[index]
}

export const selectionCornerRadiiAtom = atom<SelectionCornerRadii>((get) => {
  const shapes = get(selectedShapesAtom)
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  const rects = shapes.filter((s): s is RectShape => s.type === 'rect')
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */

  if (rects.length === 0) {
    return { hasRects: false, tl: 0, tr: 0, br: 0, bl: 0 }
  }

  return {
    hasRects: true,
    tl: cornerValue(rects, 0),
    tr: cornerValue(rects, 1),
    br: cornerValue(rects, 2),
    bl: cornerValue(rects, 3),
  }
})
