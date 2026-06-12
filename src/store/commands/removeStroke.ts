import { createCommand } from './createCommand'

export const removeStrokeCommand = createCommand<undefined>(
  'Remove stroke',
  (doc, _payload, selection) => {
    const selectedSet = new Set(selection)

    const nextShapes = doc.shapes.map((shape) => {
      if (!selectedSet.has(shape.id)) return shape
      if (shape.stroke === undefined || shape.stroke === 'none') return shape
      return { ...shape, stroke: undefined }
    })

    const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
    if (!changed) return {}
    return { icon: { ...doc, shapes: nextShapes } }
  },
)
