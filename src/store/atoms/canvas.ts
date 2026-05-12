import { atom } from 'jotai'

import { documentAtom } from './document'

export const CANVAS_SIZE = 512

export const viewBoxScaleAtom = atom((get) => {
  const doc = get(documentAtom)
  const viewBoxWidth = doc.viewBox[2]
  return CANVAS_SIZE / viewBoxWidth
})
