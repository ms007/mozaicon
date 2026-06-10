import { createCommand } from './createCommand'

export const renameShapeCommand = createCommand<{ id: string; name: string }>(
  'Rename shape',
  (doc, { id, name }) => {
    const trimmed = name.trim()
    if (!trimmed) return {}

    const idx = doc.shapes.findIndex((s) => s.id === id)
    if (idx === -1) return {}
    if (doc.shapes[idx].name === trimmed) return {}

    const shapes = doc.shapes.map((s, i) => (i === idx ? { ...s, name: trimmed } : s))
    return { icon: { ...doc, shapes } }
  },
)
