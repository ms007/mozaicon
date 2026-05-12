import { assertNever } from '@/lib/util/assertNever'
import type { Shape } from '@/types/shapes'

import type { Vec2 } from './vec2'

export function scaleShape(shape: Shape, anchor: Vec2, sx: number, sy: number): Shape {
  if (sx === 1 && sy === 1) return shape

  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  switch (shape.type) {
    case 'rect': {
      const newX = anchor.x + (shape.x - anchor.x) * sx
      const newY = anchor.y + (shape.y - anchor.y) * sy
      const newWidth = shape.width * Math.abs(sx)
      const newHeight = shape.height * Math.abs(sy)

      const x = sx < 0 ? newX - newWidth : newX
      const y = sy < 0 ? newY - newHeight : newY

      return { ...shape, x, y, width: newWidth, height: newHeight }
    }
    default:
      return assertNever(shape.type)
  }
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}
