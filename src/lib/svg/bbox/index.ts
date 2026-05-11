import type { Rect } from '@/lib/geometry/rect'
import { unionRects } from '@/lib/geometry/rect'
import { assertNever } from '@/lib/util/assertNever'
import type { Shape } from '@/types/shapes'

import { bboxOfRect } from './rect'

export function bboxOf(shape: Shape): Rect {
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  switch (shape.type) {
    case 'rect':
      return bboxOfRect(shape)
    default:
      return assertNever(shape.type)
  }
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}

export function bboxOfMany(shapes: readonly Shape[]): Rect | null {
  return unionRects(shapes.map(bboxOf))
}
