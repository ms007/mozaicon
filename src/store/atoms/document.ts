import { atom } from 'jotai'
import { splitAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'
import { atomWithImmer } from 'jotai-immer'

import { DEFAULT_VIEWBOX, type Document, type Shape } from '@/types/shapes'

export const documentAtom = atomWithImmer<Document>({
  id: 'doc-1',
  name: 'Untitled',
  viewBox: [...DEFAULT_VIEWBOX] as Document['viewBox'],
  shapes: [],
})

export const shapesAtom = atom(
  (get) => get(documentAtom).shapes,
  (_get, set, shapes: Shape[]) => {
    set(documentAtom, (draft) => {
      draft.shapes = shapes
    })
  },
)

export const shapeAtomsAtom = splitAtom(shapesAtom)

// Immer keeps unchanged shapes referentially stable, so .find() returns the
// same reference when other shapes mutate — Jotai's Object.is check then
// suppresses notification to subscribers of unaffected ids.
export const shapeAtom = atomFamily((id: string) =>
  atom((get) => get(shapesAtom).find((s) => s.id === id)),
)
