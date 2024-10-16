import { atom } from 'jotai'
import { nanoid } from 'nanoid'

import { canvasItemsAtom, canvasItemsAtomFamily, canvasSelectedItemsAtom } from './atoms'

export const canvasCreateCanvasItem = atom(null, (_, set, canvasItem) => {
  const id = nanoid()

  const { type, width, height } = canvasItem
  canvasItem.width = width > 0 ? width : 1
  canvasItem.height = height > 0 ? height : 1

  set(canvasItemsAtom, (canvasItems) => [...canvasItems, id])
  set(canvasItemsAtomFamily(id), {
    ...canvasItem,
    id,
    name: type.charAt(0).toUpperCase() + type.slice(1),
  })
  setTimeout(() => set(canvasSelectedItemsAtom, [id], 0))
})

export const canvasResetSelectedItems = atom(null, (_, set) => {
  set(canvasSelectedItemsAtom, [])
})
