import { atom } from 'jotai'

import { shapeAtom } from './document'

export const selectedIdsAtom = atom<string[]>([])

export const selectedShapesAtom = atom((get) => {
  const ids = get(selectedIdsAtom)
  return ids.map((id) => get(shapeAtom(id))).filter((s) => s !== undefined)
})

export const hasSelectionAtom = atom((get) => get(selectedIdsAtom).length > 0)
