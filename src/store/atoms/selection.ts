import { atom } from 'jotai'

import { shapeByIdAtom } from './document'

export const selectedIdsAtom = atom<string[]>([])

export const selectedShapesAtom = atom((get) => {
  const ids = get(selectedIdsAtom)
  const byId = get(shapeByIdAtom)
  return ids.map((id) => byId.get(id)).filter((s) => s !== undefined)
})

export const hasSelectionAtom = atom((get) => get(selectedIdsAtom).length > 0)
