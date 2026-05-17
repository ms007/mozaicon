import { assertNever } from '@/lib/util/assertNever'
import type { Shape } from '@/types/shapes'

export function translateShape(shape: Shape, dx: number, dy: number): Shape {
  if (dx === 0 && dy === 0) return shape

  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  switch (shape.type) {
    case 'rect':
      return { ...shape, x: shape.x + dx, y: shape.y + dy }
    default:
      return assertNever(shape.type)
  }
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}
