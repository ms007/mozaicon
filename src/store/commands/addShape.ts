import { DEFAULT_CORNERS, normalizeCorners } from '@/lib/geometry/corner-radius'
import { newId } from '@/lib/ids'
import type { Corners, Shape } from '@/types/shapes'

import { createCommand } from './createCommand'

const DEFAULT_SHAPE_NAMES: Record<Shape['type'], string> = {
  rect: 'Rect',
}

export type AddShapePayload = Omit<Shape, 'id' | 'name' | 'visible' | 'locked' | 'corners'> &
  Partial<Pick<Shape, 'id' | 'name' | 'visible' | 'locked'>> & { corners?: Corners }

export function materializeShape(payload: AddShapePayload): Shape {
  return {
    ...payload,
    corners: payload.corners
      ? normalizeCorners(payload.corners, payload.width, payload.height)
      : DEFAULT_CORNERS,
    id: payload.id ?? newId(),
    name: payload.name ?? DEFAULT_SHAPE_NAMES[payload.type],
    visible: payload.visible ?? true,
    locked: payload.locked ?? false,
  }
}

export const addShapeCommand = createCommand<AddShapePayload>('Add shape', (doc, payload) => {
  const shape = materializeShape(payload)
  return {
    document: { ...doc, shapes: [...doc.shapes, shape] },
    selection: [shape.id],
  }
})
