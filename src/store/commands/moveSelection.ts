import { quantizeShape } from '@/lib/geometry/quantize'
import { translateShape } from '@/lib/geometry/translate'

import { createCommand } from './createCommand'

export type MoveSelectionPayload = {
  ids: string[]
  dx: number
  dy: number
}

export const moveSelectionCommand = createCommand<MoveSelectionPayload>(
  'Move selection',
  (doc, { ids, dx, dy }) => {
    if (ids.length === 0) return {}
    if (dx === 0 && dy === 0) return {}

    const idSet = new Set(ids)
    const nextShapes = doc.shapes.map((shape) =>
      idSet.has(shape.id) ? quantizeShape(translateShape(shape, dx, dy)) : shape,
    )

    const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
    if (!changed) return {}
    return { icon: { ...doc, shapes: nextShapes } }
  },
)
