import { atom } from 'jotai'

import { rectFromPoints } from '@/lib/geometry/rect'
import { rectsIntersect } from '@/lib/geometry/rectsIntersect'
import type { Vec2 } from '@/lib/geometry/vec2'
import { isSelectable } from '@/lib/selection'
import { bboxOf } from '@/lib/svg/bbox'

import { documentAtom } from './document'

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

  const hitSet = new Set(hits)
  const result: string[] = []
  for (const id of draft.baseSelection) {
    if (!hitSet.has(id)) {
      result.push(id)
    } else {
      hitSet.delete(id)
    }
  }
  for (const id of hits) {
    if (hitSet.has(id)) {
      result.push(id)
    }
  }
  return result
})
