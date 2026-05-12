import type { Rect } from '@/lib/geometry/rect'
import { rectEqual } from '@/lib/geometry/rect'

import { createCommand } from './createCommand'

export type ResizeShapePayload = Record<string, Rect>

export const resizeShapeCommand = createCommand<ResizeShapePayload>(
  'Resize shape',
  (doc, geometryById) => {
    if (Object.keys(geometryById).length === 0) return doc

    const nextShapes = doc.shapes.map((shape) => {
      const geo = geometryById[shape.id] as Rect | undefined
      if (!geo) return shape
      if (rectEqual(shape, geo)) return shape
      return { ...shape, ...geo }
    })

    const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
    if (!changed) return doc
    return { ...doc, shapes: nextShapes }
  },
)
