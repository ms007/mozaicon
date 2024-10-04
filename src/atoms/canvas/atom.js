import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'

export const canvasItemsAtom = atom([])

export const canvasItemsAtomFamily = atomFamily(
  ({ id, type }) => {
    const familyAtom = atom({ id, type })
    familyAtom.debugLabel = `canvasItemAtom.${id}`
    return familyAtom
  },
  (a, b) => a.id === b.id
)
