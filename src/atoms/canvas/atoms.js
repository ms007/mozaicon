import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'

export const canvasItemsMap = atom({})
export const canvasItemsAtom = atom([])
export const canvasSelectedItemsAtom = atom([])
export const canvasHoveredItemAtom = atom(null)
export const canvasIsResizingItemAtom = atom(false)

export const canvasItemsAtomFamily = atomFamily(
  (id) => {
    const canvasItemAtom = atom(
      (get) => get(canvasItemsMap)[id],
      (get, set, item) => {
        const map = get(canvasItemsMap)
        const prev = map[id]
        const updates = typeof item === 'function' ? item(prev) : item
        set(canvasItemsMap, { ...map, [id]: { ...prev, ...updates } })
      }
    )
    canvasItemAtom.debugLabel = `canvasItemAtom-${id}`
    return canvasItemAtom
  },
  (a, b) => a === b
)
