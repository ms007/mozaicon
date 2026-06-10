import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

import { rectEqual } from '@/lib/geometry/rect'
import { bboxOfMany } from '@/lib/svg/bbox'
import type { Icon } from '@/types/shapes'

import { shapeAtom } from './project'

const EMPTY: string[] = []

const _selectedIdsAtom = atom<string[]>(EMPTY)

export const selectedIdsAtom = atom((get) => get(_selectedIdsAtom))

export const selectedShapesAtom = atom((get) => {
  const ids = get(selectedIdsAtom)
  return ids.map((id) => get(shapeAtom(id))).filter((s) => s !== undefined)
})

export const hasSelectionAtom = atom((get) => get(selectedIdsAtom).length > 0)

export const isShapeSelectedAtom = atomFamily((id: string) =>
  atom((get) => get(selectedIdsAtom).includes(id)),
)

export const selectionBboxAtom = selectAtom(selectedShapesAtom, bboxOfMany, rectEqual)

const visibleSelectedShapesAtom = atom((get) => {
  return get(selectedShapesAtom).filter((s) => s.visible)
})

export const visibleSelectionBboxAtom = selectAtom(visibleSelectedShapesAtom, bboxOfMany, rectEqual)

export function selectionEqual(a: string[], b: string[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export function normalizeSelection(ids: string[], doc: Icon): string[] {
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

// `doc` is passed explicitly (not read via get(activeIconAtom)) so callers can
// normalize against a post-mutation icon before that icon is written to the
// store — needed by add-and-select commands where the new id is not yet in
// activeIconAtom at commit time.
export const commitSelectionAtom = atom(null, (get, set, payload: { ids: string[]; doc: Icon }) => {
  const before = get(_selectedIdsAtom)
  const normalized = normalizeSelection(payload.ids, payload.doc)
  const changed = !selectionEqual(normalized, before)
  if (changed) set(_selectedIdsAtom, normalized)
  return { changed, ids: normalized }
})

export const restoreSelectionAtom = atom(null, (_get, set, ids: string[]) => {
  set(_selectedIdsAtom, ids)
})
