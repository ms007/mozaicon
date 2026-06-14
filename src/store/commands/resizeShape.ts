import { quantizeRect } from '@/lib/geometry/quantize'
import type { Rect } from '@/lib/geometry/rect'
import { rectEqual } from '@/lib/geometry/rect'

import { createCommand } from './createCommand'

export type ResizeShapePayload = Record<string, Rect>

export const resizeShapeCommand = createCommand<ResizeShapePayload>(
  'Resize shape',
  (doc, geometryById) => {
    if (Object.keys(geometryById).length === 0) return {}

    const nextShapes = doc.shapes.map((shape) => {
      const geo = geometryById[shape.id] as Rect | undefined
      if (!geo) return shape
      const quantized = quantizeRect(geo)
      if (rectEqual(shape, quantized)) return shape
      return { ...shape, ...quantized }
    })

    const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
    if (!changed) return {}
    return { icon: { ...doc, shapes: nextShapes } }
  },
)
