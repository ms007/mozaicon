import { atom } from 'jotai'

import { canvasIsCreatingNewItemAtom, canvasNewItemTypeAtom } from './atom'

export const canvasWithNewCanvasItemAtom = atom(null, (_, set, type) => {
  set(canvasNewItemTypeAtom, type)
  set(canvasIsCreatingNewItemAtom, true)
})
