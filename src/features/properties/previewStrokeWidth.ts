import { atom } from 'jotai'

import { strokePreviewDraftAtom } from '@/store/atoms/gestures/strokePreview'
import { selectedShapesAtom } from '@/store/atoms/selection'

export const previewStrokeWidthAtom = atom(null, (get, set, width: number) => {
  const shapes = get(selectedShapesAtom)
  if (shapes.length === 0) return
  const draft: Record<string, { strokeWidth: number }> = {}
  for (const shape of shapes) {
    draft[shape.id] = { strokeWidth: width }
  }
  set(strokePreviewDraftAtom, draft)
})

export const clearStrokePreviewAtom = atom(null, (_get, set) => {
  set(strokePreviewDraftAtom, null)
})
