import { atom } from 'jotai'

import { strokePreviewDraftAtom } from '@/store/atoms/gestures/strokePreview'
import { selectedShapesAtom } from '@/store/atoms/selection'

export const previewStrokeColorAtom = atom(null, (get, set, color: string) => {
  const shapes = get(selectedShapesAtom)
  if (shapes.length === 0) return
  const draft: Record<string, { stroke: string }> = {}
  for (const shape of shapes) {
    draft[shape.id] = { stroke: color }
  }
  set(strokePreviewDraftAtom, draft)
})

export const clearStrokeColorPreviewAtom = atom(null, (_get, set) => {
  set(strokePreviewDraftAtom, null)
})
