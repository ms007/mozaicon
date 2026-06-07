import { clampRadii, effectiveRadii, isUniform } from '@/lib/geometry/corner-radius'
import type { Radii, RectShape } from '@/types/shapes'

import { createCommand } from './createCommand'

export type SetCornerRadiusPayload = { radius: number } | { corner: 0 | 1 | 2 | 3; radius: number }

function withoutRadiiFields(shape: RectShape): Omit<RectShape, 'rx' | 'radii'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stripping optional fields
  const { rx: _rx, radii: _radii, ...rest } = shape
  return rest
}

function applyRadius(shape: RectShape, payload: SetCornerRadiusPayload): RectShape | null {
  const before = effectiveRadii(shape)
  let next: Radii

  if ('corner' in payload) {
    next = [...before] as Radii
    next[payload.corner] = payload.radius
  } else {
    const r = payload.radius
    next = [r, r, r, r]
  }

  next = clampRadii(next, shape.width, shape.height)

  if (
    next[0] === before[0] &&
    next[1] === before[1] &&
    next[2] === before[2] &&
    next[3] === before[3]
  ) {
    return null
  }

  const base = withoutRadiiFields(shape)

  if (isUniform(next)) {
    return next[0] === 0 ? { ...base } : { ...base, rx: next[0] }
  }

  return { ...base, radii: next }
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
    return { document: { ...doc, shapes: nextShapes } }
  },
)
