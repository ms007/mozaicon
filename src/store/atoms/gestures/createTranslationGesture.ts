import type { Atom, Getter, PrimitiveAtom } from 'jotai'
import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { type AtomFamily, atomFamily } from 'jotai-family'

import { translateRect } from '@/lib/geometry/rect'
import { bboxOfMany } from '@/lib/svg/bbox'
import { shapeAtom } from '@/store/atoms/project'

import type { DisplayContribution, GestureAdapter } from './registry'

export type TranslationDraft = {
  ids: string[]
  dx: number
  dy: number
}

export type TranslationGesture = {
  draftAtom: PrimitiveAtom<TranslationDraft | null>
  isActiveAtom: Atom<boolean>
  draftForShapeAtom: AtomFamily<string, Atom<{ dx: number; dy: number } | null>>
  adapter: GestureAdapter<TranslationDraft>
}

export function createTranslationGesture(name: string): TranslationGesture {
  const draftAtom = atom<TranslationDraft | null>(null)
  draftAtom.debugLabel = `${name}DraftAtom`

  const isActiveAtom = atom((get) => get(draftAtom) !== null)

  const draftForShapeAtom = atomFamily((id: string) =>
    selectAtom(
      draftAtom,
      (draft) => (draft?.ids.includes(id) ? { dx: draft.dx, dy: draft.dy } : null),
      (a, b) => {
        if (a === b) return true
        if (a === null || b === null) return false
        return a.dx === b.dx && a.dy === b.dy
      },
    ),
  )

  // Bbox of the frozen draft ids, not the live selection bbox: the two diverge
  // when the selection contains locked shapes that the gesture excludes.
  function displayBbox({ ids, dx, dy }: TranslationDraft, get: Getter): DisplayContribution {
    const shapes = ids
      .map((id) => get(shapeAtom(id)))
      .filter((s) => s !== undefined)
      .filter((s) => s.visible)
    const bbox = bboxOfMany(shapes)
    if (!bbox) return { kind: 'hide' }
    return { kind: 'rect', value: translateRect(bbox, dx, dy) }
  }

  const adapter: GestureAdapter<TranslationDraft> = {
    name,
    draftAtom,
    displayBbox,
  }

  return { draftAtom, isActiveAtom, draftForShapeAtom, adapter }
}
