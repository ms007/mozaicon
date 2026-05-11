import type { Rect } from '@/lib/geometry/rect'
import type { RectShape } from '@/types/shapes'

export function bboxOfRect(shape: RectShape): Rect {
  return { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
}
