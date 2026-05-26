import type { Getter } from 'jotai'
import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

import { translateRect } from '@/lib/geometry/rect'
import { selectionBboxAtom } from '@/store/atoms/selection'

import type { DisplayContribution, GestureAdapter } from './registry'

export type MoveDraft = {
  ids: string[]
  dx: number
  dy: number
}

export const moveDraftAtom = atom<MoveDraft | null>(null)

export const isMovingAtom = atom((get) => get(moveDraftAtom) !== null)

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

function moveDisplayBbox({ dx, dy }: MoveDraft, get: Getter): DisplayContribution {
  const bbox = get(selectionBboxAtom)
  if (!bbox) return { kind: 'hide' }
  return { kind: 'rect', value: translateRect(bbox, dx, dy) }
}

export const moveAdapter: GestureAdapter<MoveDraft> = {
  name: 'move',
  draftAtom: moveDraftAtom,
  displayBbox: moveDisplayBbox,
}
