import { newId } from '@/lib/ids'
import type { Shape } from '@/types/shapes'

import { createCommand } from './createCommand'

// Exhaustive: adding a shape type without an entry here fails type-check.
const DEFAULT_SHAPE_NAMES: Record<Shape['type'], string> = {
  rect: 'Rect',
}

export type AddShapePayload = Omit<Shape, 'id' | 'name' | 'visible' | 'locked'> &
  Partial<Pick<Shape, 'id' | 'name' | 'visible' | 'locked'>>

export function materializeShape(payload: AddShapePayload): Shape {
  return {
    ...payload,
    id: payload.id ?? newId(),
    name: payload.name ?? DEFAULT_SHAPE_NAMES[payload.type],
    visible: payload.visible ?? true,
    locked: payload.locked ?? false,
  }
}

export const addShapeCommand = createCommand<AddShapePayload>('Add shape', (doc, payload) => ({
  ...doc,
  shapes: [...doc.shapes, materializeShape(payload)],
}))
