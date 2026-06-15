import { createCommand } from './createCommand'

export const setFillColorCommand = createCommand<string>(
  'Set fill color',
  (doc, color, selection) => {
    const selectedSet = new Set(selection)

    const nextShapes = doc.shapes.map((shape) => {
      if (!selectedSet.has(shape.id)) return shape
      if (shape.fill === color) return shape
      return { ...shape, fill: color }
    })

    const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
    if (!changed) return {}
    return { icon: { ...doc, shapes: nextShapes } }
  },
)
