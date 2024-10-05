import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'

export const canvasItemsAtom = atom([])

export const canvasItemsAtomFamily = atomFamily(
  (canvasItem) => {
    const { id } = canvasItem
    const familyAtom = atom(canvasItem)
    familyAtom.debugLabel = `canvasItemAtom.${id}`
    return familyAtom
  },
  (a, b) => a.id === b.id
)

export const canvasIsCreatingNewItemAtom = atom(false)

export const canvasNewItemTypeAtom = atom(null)
