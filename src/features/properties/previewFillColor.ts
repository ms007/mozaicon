import { atom } from 'jotai'

import { paintPreviewDraftAtom } from '@/store/atoms/gestures/paintPreview'
import { selectedShapesAtom } from '@/store/atoms/selection'

export const previewFillColorAtom = atom(null, (get, set, color: string) => {
  const shapes = get(selectedShapesAtom)
  if (shapes.length === 0) return
  const draft: Record<string, { fill: string }> = {}
  for (const shape of shapes) {
    draft[shape.id] = { fill: color }
  }
  set(paintPreviewDraftAtom, draft)
})

export const clearFillColorPreviewAtom = atom(null, (_get, set) => {
  set(paintPreviewDraftAtom, null)
})
