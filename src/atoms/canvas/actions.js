import { atom } from 'jotai'
import { nanoid } from 'nanoid'

import {
  canvasItemsAtom,
  canvasItemsAtomFamily,
  canvasNewItemTypeAtom,
  canvasIsCreatingNewItemAtom,
  canvasSelectedItemsAtom,
} from './atoms'

export const canvasCreateCanvasItemType = atom(null, (_, set, type) => {
  set(canvasNewItemTypeAtom, type)
  set(canvasIsCreatingNewItemAtom, true)
})

export const canvasCreateCanvasItem = atom(null, (_, set, canvasItem) => {
  const id = nanoid()
  const { type } = canvasItem
  set(canvasItemsAtom, (canvasItems) => [...canvasItems, id])
  set(canvasItemsAtomFamily(id), {
    ...canvasItem,
    id,
    name: type.charAt(0).toUpperCase() + type.slice(1),
  })
  set(canvasSelectedItemsAtom, [id])
})

export const canvasResetSelectedItems = atom(null, (_, set) => {
  set(canvasSelectedItemsAtom, [])
})
