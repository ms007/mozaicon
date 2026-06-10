import { normalizeCorners } from '@/lib/geometry/corner-radius'
import type { Radii, RectShape } from '@/types/shapes'

import { createCommand } from './createCommand'

export type SetCornerRadiusPayload = { radius: number } | { corner: 0 | 1 | 2 | 3; radius: number }

function applyRadius(shape: RectShape, payload: SetCornerRadiusPayload): RectShape | null {
  const before = shape.corners.radii
  let next: Radii

  if ('corner' in payload) {
    next = [...before] as Radii
    next[payload.corner] = payload.radius
  } else {
    const r = payload.radius
    next = [r, r, r, r]
  }

  const corners = normalizeCorners({ ...shape.corners, radii: next }, shape.width, shape.height)
  const clamped = corners.radii

  if (
    clamped[0] === before[0] &&
    clamped[1] === before[1] &&
    clamped[2] === before[2] &&
    clamped[3] === before[3]
  ) {
    return null
  }

  return { ...shape, corners }
}

export const setCornerRadiusCommand = createCommand<SetCornerRadiusPayload>(
  'Set corner radius',
  (doc, payload, selection) => {
    const selectedSet = new Set(selection)

    const nextShapes = doc.shapes.map((shape) => {
      /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
      if (shape.type !== 'rect') return shape
      /* eslint-enable @typescript-eslint/no-unnecessary-condition */
      if (!selectedSet.has(shape.id)) return shape
      return applyRadius(shape, payload) ?? shape
    })

    const changed = nextShapes.some((s, i) => s !== doc.shapes[i])
    if (!changed) return {}
    return { icon: { ...doc, shapes: nextShapes } }
  },
)
