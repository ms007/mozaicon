import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { rectEqual, rectFromPoints } from '@/lib/geometry/rect'
import { rectsIntersect } from '@/lib/geometry/rectsIntersect'
import type { Vec2 } from '@/lib/geometry/vec2'
import { isSelectable, symmetricDifference } from '@/lib/selection'
import { bboxOf, bboxOfMany } from '@/lib/svg/bbox'
import type { Shape } from '@/types/shapes'

import { documentAtom, shapeAtom } from './document'

export type MarqueeDraft = {
  pointerId: number
  startScreen: Vec2
  startViewBox: Vec2
  current: Vec2
  additive: boolean
  baseSelection: string[]
}

export const marqueeDraftAtom = atom<MarqueeDraft | null>(null)

export const marqueeRectAtom = atom((get) => {
  const draft = get(marqueeDraftAtom)
  if (!draft) return null
  return rectFromPoints(draft.startViewBox, draft.current)
})

export const previewSelectedIdsAtom = atom((get) => {
  const draft = get(marqueeDraftAtom)
  if (!draft) return []
  const doc = get(documentAtom)
  const rect = rectFromPoints(draft.startViewBox, draft.current)

  const hits: string[] = []
  for (const shape of doc.shapes) {
    if (!isSelectable(shape)) continue
    if (rectsIntersect(rect, bboxOf(shape))) {
      hits.push(shape.id)
    }
  }

  if (!draft.additive) return hits

  return symmetricDifference(draft.baseSelection, hits)
})

export const isMarqueeActiveAtom = atom((get) => get(marqueeDraftAtom) !== null)

const EMPTY_SHAPES: readonly Shape[] = []

const previewSelectedShapesAtom = atom((get) => {
  const ids = get(previewSelectedIdsAtom)
  if (ids.length === 0) return EMPTY_SHAPES
  return ids.map((id) => get(shapeAtom(id))).filter((s) => s !== undefined)
})

export const previewSelectionBboxAtom = selectAtom(previewSelectedShapesAtom, bboxOfMany, rectEqual)

const EMPTY_IDS: readonly string[] = []

const stringArrayEqual = (a: readonly string[], b: readonly string[]) =>
  a === b || (a.length === b.length && a.every((id, i) => id === b[i]))

const rawHighlightedShapeIdsAtom = atom((get) => {
  const draft = get(marqueeDraftAtom)
  if (!draft) return EMPTY_IDS
  return get(previewSelectedIdsAtom)
})

export const highlightedShapeIdsAtom = selectAtom(
  rawHighlightedShapeIdsAtom,
  (ids) => ids,
  stringArrayEqual,
)
