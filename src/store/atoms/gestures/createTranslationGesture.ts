import type { Atom, Getter } from 'jotai'
import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

import { translateRect } from '@/lib/geometry/rect'
import { visibleSelectionBboxAtom } from '@/store/atoms/selection'

import type { DisplayContribution, GestureAdapter } from './registry'

export type TranslationDraft = {
  ids: string[]
  dx: number
  dy: number
}

export type TranslationGesture = {
  draftAtom: ReturnType<typeof atom<TranslationDraft | null>>
  isActiveAtom: Atom<boolean>
  draftForShapeAtom: ReturnType<
    typeof atomFamily<
      string,
      ReturnType<typeof selectAtom<TranslationDraft | null, { dx: number; dy: number } | null>>
    >
  >
  adapter: GestureAdapter<TranslationDraft>
}

export function createTranslationGesture(name: string): TranslationGesture {
  const draftAtom = atom<TranslationDraft | null>(null)
  draftAtom.debugLabel = `${name}DraftAtom`

  const isActiveAtom = atom((get) => get(draftAtom) !== null)
  const capitalized = name[0].toUpperCase() + name.slice(1)
  const verbal = capitalized.endsWith('e') ? `${capitalized.slice(0, -1)}ing` : `${capitalized}ing`
  isActiveAtom.debugLabel = `is${verbal}Atom`

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

  function displayBbox({ dx, dy }: TranslationDraft, get: Getter): DisplayContribution {
    const bbox = get(visibleSelectionBboxAtom)
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
