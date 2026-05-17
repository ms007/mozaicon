import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { rectEqual } from '@/lib/geometry/rect'
import { bboxOfMany } from '@/lib/svg/bbox'
import type { Document } from '@/types/shapes'

import { shapeAtom } from './document'

export const selectedIdsAtom = atom<string[]>([])

export const selectedShapesAtom = atom((get) => {
  const ids = get(selectedIdsAtom)
  return ids.map((id) => get(shapeAtom(id))).filter((s) => s !== undefined)
})

export const hasSelectionAtom = atom((get) => get(selectedIdsAtom).length > 0)

export const selectionBboxAtom = selectAtom(selectedShapesAtom, bboxOfMany, rectEqual)

const EMPTY: string[] = []

export function normalizeSelection(ids: string[], doc: Document): string[] {
  if (ids.length === 0) return EMPTY
  const wanted = new Set(ids)
  const result: string[] = []
  for (const shape of doc.shapes) {
    if (wanted.delete(shape.id)) {
      result.push(shape.id)
      if (wanted.size === 0) break
    }
  }
  return result.length === 0 ? EMPTY : result
}
