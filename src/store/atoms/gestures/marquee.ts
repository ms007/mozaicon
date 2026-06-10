import type { Getter } from 'jotai'
import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { rectEqual, rectFromPoints } from '@/lib/geometry/rect'
import { rectsIntersect } from '@/lib/geometry/rectsIntersect'
import type { Vec2 } from '@/lib/geometry/vec2'
import { isSelectable, symmetricDifference } from '@/lib/selection'
import { bboxOf, bboxOfMany } from '@/lib/svg/bbox'
import type { Shape } from '@/types/shapes'

import { activeIconAtom, shapeAtom } from '../project'
import { selectionEqual } from '../selection'
import type { DisplayContribution, GestureAdapter } from './registry'

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
  const doc = get(activeIconAtom)
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

const EMPTY_IDS: string[] = []

const rawHighlightedShapeIdsAtom = atom((get) => {
  const draft = get(marqueeDraftAtom)
  if (!draft) return EMPTY_IDS
  return get(previewSelectedIdsAtom)
})

export const highlightedShapeIdsAtom = selectAtom(
  rawHighlightedShapeIdsAtom,
  (ids) => ids,
  selectionEqual,
)

function marqueeDisplayBbox(draft: MarqueeDraft, get: Getter): DisplayContribution {
  const preview = get(previewSelectionBboxAtom)
  if (preview) return { kind: 'rect', value: preview }
  if (draft.additive) return { kind: 'hide' }
  return { kind: 'passThrough' }
}

export const marqueeAdapter: GestureAdapter<MarqueeDraft> = {
  name: 'marquee',
  draftAtom: marqueeDraftAtom,
  displayBbox: marqueeDisplayBbox,
  // A marquee never mutates the document (it only commits selection on
  // pointerup, after clearing its own draft), so it must not block commands.
  // Otherwise the blur-commit triggered by the same pointerdown that arms the
  // marquee — e.g. clicking the canvas to leave a properties field — is dropped.
  blocksCommands: false,
}
