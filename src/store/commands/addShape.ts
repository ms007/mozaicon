import { newId } from '@/lib/ids'
import type { RectShape } from '@/types/shapes'

import { createCommand } from './createCommand'

export type AddRectPayload = Omit<RectShape, 'id' | 'type' | 'name' | 'visible' | 'locked'> &
  Partial<Pick<RectShape, 'id' | 'name' | 'visible' | 'locked'>>

export const addShapeCommand = createCommand<AddRectPayload>('Add shape', (doc, payload) => {
  const shape: RectShape = {
    ...payload,
    id: payload.id ?? newId(),
    type: 'rect',
    name: payload.name ?? 'Rect',
    visible: payload.visible ?? true,
    locked: payload.locked ?? false,
  }

  return {
    ...doc,
    shapes: [...doc.shapes, shape],
  }
})
