import { atom } from 'jotai'

import { canvasItemsAtom } from '@/atoms/canvas'

export const sidebarWidthAtom = atom(342)
export const sidebarDraggedItemAtom = atom(null)
export const sidebarEditingItemAtom = atom(null)

export const sidebarItemsAtom = atom(
  (get) => {
    const canvasItems = get(canvasItemsAtom)
    return [...canvasItems].reverse()
  },
  (_, set, items) => {
    set(canvasItemsAtom, [...items].reverse())
  }
)
