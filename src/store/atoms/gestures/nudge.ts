import type { Getter } from 'jotai'
import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

import { translateRect } from '@/lib/geometry/rect'
import { visibleSelectionBboxAtom } from '@/store/atoms/selection'

import type { DisplayContribution, GestureAdapter } from './registry'

export type NudgeDraft = {
  ids: string[]
  dx: number
  dy: number
}

export const nudgeDraftAtom = atom<NudgeDraft | null>(null)

export const nudgeDraftForShapeAtom = atomFamily((id: string) =>
  selectAtom(
    nudgeDraftAtom,
    (draft) => (draft?.ids.includes(id) ? { dx: draft.dx, dy: draft.dy } : null),
    (a, b) => {
      if (a === b) return true
      if (a === null || b === null) return false
      return a.dx === b.dx && a.dy === b.dy
    },
  ),
)

function nudgeDisplayBbox({ dx, dy }: NudgeDraft, get: Getter): DisplayContribution {
  const bbox = get(visibleSelectionBboxAtom)
  if (!bbox) return { kind: 'hide' }
  return { kind: 'rect', value: translateRect(bbox, dx, dy) }
}

export const nudgeAdapter: GestureAdapter<NudgeDraft> = {
  name: 'nudge',
  draftAtom: nudgeDraftAtom,
  displayBbox: nudgeDisplayBbox,
}
