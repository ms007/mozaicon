import { DEFAULT_CORNERS, normalizeCorners } from '@/lib/geometry/corner-radius'
import { newId } from '@/lib/ids'
import { quantize } from '@/lib/util/number'
import type { Corners, Shape } from '@/types/shapes'

import { createCommand } from './createCommand'

const DEFAULT_SHAPE_NAMES: Record<Shape['type'], string> = {
  rect: 'Rect',
}

export type AddShapePayload = Omit<Shape, 'id' | 'name' | 'visible' | 'locked' | 'corners'> &
  Partial<Pick<Shape, 'id' | 'name' | 'visible' | 'locked'>> & { corners?: Corners }

export function materializeShape(payload: AddShapePayload): Shape {
  const width = quantize(payload.width)
  const height = quantize(payload.height)
  return {
    ...payload,
    x: quantize(payload.x),
    y: quantize(payload.y),
    width,
    height,
    corners: payload.corners ? normalizeCorners(payload.corners, width, height) : DEFAULT_CORNERS,
    id: payload.id ?? newId(),
    name: payload.name ?? DEFAULT_SHAPE_NAMES[payload.type],
    visible: payload.visible ?? true,
    locked: payload.locked ?? false,
  }
}

export const addShapeCommand = createCommand<AddShapePayload>('Add shape', (doc, payload) => {
  const shape = materializeShape(payload)
  return {
    icon: { ...doc, shapes: [...doc.shapes, shape] },
    selection: [shape.id],
  }
})
