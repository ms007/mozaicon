import { createCommand } from './createCommand'

export const setStrokeColorCommand = createCommand<string>(
  'Set stroke color',
  (doc, color, selection) => {
    const selectedSet = new Set(selection)

    const nextShapes = doc.shapes.map((shape) => {
      if (!selectedSet.has(shape.id)) return shape
      if (shape.stroke === color) return shape
      return {
        ...shape,
        stroke: color,
        strokeWidth: shape.strokeWidth ?? 2,
      }
    })

    const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
    if (!changed) return {}
    return { icon: { ...doc, shapes: nextShapes } }
  },
)
