import type { CornerStyle } from '@/types/shapes'

import { createCommand } from './createCommand'

export const setCornerStyleCommand = createCommand<CornerStyle>(
  'Set corner style',
  (doc, style, selection) => {
    const selectedSet = new Set(selection)

    const nextShapes = doc.shapes.map((shape) => {
      /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
      if (shape.type !== 'rect') return shape
      /* eslint-enable @typescript-eslint/no-unnecessary-condition */
      if (!selectedSet.has(shape.id)) return shape
      if (shape.corners.style === style) return shape
      return { ...shape, corners: { ...shape.corners, style } }
    })

    const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
    if (!changed) return {}
    return { icon: { ...doc, shapes: nextShapes } }
  },
)
