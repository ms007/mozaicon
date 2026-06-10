import { normalizeCorners } from '@/lib/geometry/corner-radius'

import { createCommand } from './createCommand'

export const setSmoothingCommand = createCommand<number>(
  'Set smoothing',
  (doc, rawSmoothing, selection) => {
    const selectedSet = new Set(selection)

    const nextShapes = doc.shapes.map((shape) => {
      /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
      if (shape.type !== 'rect') return shape
      /* eslint-enable @typescript-eslint/no-unnecessary-condition */
      if (!selectedSet.has(shape.id)) return shape
      const corners = normalizeCorners(
        { ...shape.corners, smoothing: rawSmoothing },
        shape.width,
        shape.height,
      )
      if (corners.smoothing === shape.corners.smoothing) return shape
      return { ...shape, corners }
    })

    const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
    if (!changed) return {}
    return { icon: { ...doc, shapes: nextShapes } }
  },
)
