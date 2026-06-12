import { createCommand } from './createCommand'

export const addStrokeCommand = createCommand<string | undefined>(
  'Add stroke',
  (doc, color, selection) => {
    const selectedSet = new Set(selection)

    const nextShapes = doc.shapes.map((shape) => {
      if (!selectedSet.has(shape.id)) return shape
      if (shape.stroke !== undefined && shape.stroke !== 'none') return shape
      return {
        ...shape,
        stroke: color ?? '#000',
        strokeWidth: shape.strokeWidth ?? 2,
      }
    })

    const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
    if (!changed) return {}
    return { icon: { ...doc, shapes: nextShapes } }
  },
)
