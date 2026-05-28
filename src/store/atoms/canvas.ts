import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { documentAtom } from './document'

export const CANVAS_SIZE = 512

// Single source for the canvas coordinate system. Immer keeps the viewBox array
// referentially stable across unrelated document mutations, so the default
// Object.is equality already suppresses spurious re-renders.
export const viewBoxAtom = selectAtom(documentAtom, (doc) => doc.viewBox)

export const viewBoxScaleAtom = atom((get) => {
  const viewBoxWidth = get(viewBoxAtom)[2]
  return CANVAS_SIZE / viewBoxWidth
})
