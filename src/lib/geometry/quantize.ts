import { assertNever } from '@/lib/util/assertNever'
import { quantize } from '@/lib/util/number'
import type { Shape } from '@/types/shapes'

import type { Rect } from './rect'

export function quantizeRect(rect: Rect): Rect {
  return {
    x: quantize(rect.x),
    y: quantize(rect.y),
    width: quantize(rect.width),
    height: quantize(rect.height),
  }
}

export function quantizeShape(shape: Shape): Shape {
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  switch (shape.type) {
    case 'rect':
      return {
        ...shape,
        x: quantize(shape.x),
        y: quantize(shape.y),
        width: quantize(shape.width),
        height: quantize(shape.height),
      }
    default:
      return assertNever(shape.type)
  }
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}
