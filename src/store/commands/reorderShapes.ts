import { moveBlockBefore } from '@/lib/order/block'
import { type ReorderDirection, reorderStep } from '@/lib/order/reorderStep'
import { normalizeSelection } from '@/store/atoms/selection'

import { createCommand } from './createCommand'

export const reorderStepCommand = createCommand<{ ids: string[]; direction: ReorderDirection }>(
  'Reorder shapes',
  (doc, { ids, direction }) => {
    const { shapes, changed } = reorderStep(doc.shapes, ids, direction)
    if (!changed) return {}

    const nextDoc = { ...doc, shapes }
    const selection = normalizeSelection(ids, nextDoc)

    return { icon: nextDoc, selection }
  },
)

export const moveShapeBlockCommand = createCommand<{
  ids: string[]
  beforeId: string | null
}>('Reorder shapes', (doc, { ids, beforeId }, selection) => {
  const result = moveBlockBefore(doc.shapes, ids, beforeId)
  if (!result.changed) return {}

  const nextDoc = { ...doc, shapes: result.shapes }
  return {
    icon: nextDoc,
    selection: normalizeSelection(selection, nextDoc),
  }
})
