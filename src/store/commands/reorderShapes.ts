import { moveBlockBefore } from '@/lib/order/block'
import { nudge, type NudgeDirection } from '@/lib/order/nudge'
import { normalizeSelection } from '@/store/atoms/selection'

import { createCommand } from './createCommand'

export const nudgeShapeOrderCommand = createCommand<{ ids: string[]; direction: NudgeDirection }>(
  'Reorder shapes',
  (doc, { ids, direction }) => {
    const { shapes, changed } = nudge(doc.shapes, ids, direction)
    if (!changed) return {}

    const nextDoc = { ...doc, shapes }
    const selection = normalizeSelection(ids, nextDoc)

    return { document: nextDoc, selection }
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
    document: nextDoc,
    selection: normalizeSelection(selection, nextDoc),
  }
})
