import { clamp } from '@/lib/util/number'

import { createCommand } from './createCommand'

export const setStrokeWidthCommand = createCommand<number>(
  'Set stroke width',
  (doc, rawWidth, selection) => {
    const selectedSet = new Set(selection)
    const width = clamp(rawWidth, { min: 0 })

    const nextShapes = doc.shapes.map((shape) => {
      if (!selectedSet.has(shape.id)) return shape
      if (shape.strokeWidth === width) return shape
      return { ...shape, strokeWidth: width }
    })

    const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
    if (!changed) return {}
    return { icon: { ...doc, shapes: nextShapes } }
  },
)
