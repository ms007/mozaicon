import { createCommand } from './createCommand'

export const toggleShapeVisibilityCommand = createCommand<{ id: string }>(
  'Toggle visibility',
  (doc, { id }) => {
    const idx = doc.shapes.findIndex((s) => s.id === id)
    if (idx === -1) return {}

    const shape = doc.shapes[idx]
    const nextShapes = doc.shapes.slice()
    nextShapes[idx] = { ...shape, visible: !shape.visible }

    return { icon: { ...doc, shapes: nextShapes } }
  },
)
