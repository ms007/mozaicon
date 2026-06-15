import { createCommand } from './createCommand'

export const addFillCommand = createCommand<string | undefined>(
  'Add fill',
  (doc, color, selection) => {
    const selectedSet = new Set(selection)

    const nextShapes = doc.shapes.map((shape) => {
      if (!selectedSet.has(shape.id)) return shape
      if (shape.fill !== undefined && shape.fill !== 'none') return shape
      return { ...shape, fill: color ?? '#cccccc' }
    })

    const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
    if (!changed) return {}
    return { icon: { ...doc, shapes: nextShapes } }
  },
)
