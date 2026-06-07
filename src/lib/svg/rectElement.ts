import { isUniform, roundedRectPath } from '@/lib/geometry/corner-radius'
import type { RectShape } from '@/types/shapes'

export type RectElement =
  | { tag: 'rect'; attrs: { x: number; y: number; width: number; height: number; rx?: number } }
  | { tag: 'path'; attrs: { d: string } }

export function chooseRectElement(shape: RectShape): RectElement {
  if (shape.radii && !isUniform(shape.radii)) {
    const d = roundedRectPath(shape.x, shape.y, shape.width, shape.height, shape.radii)
    return { tag: 'path', attrs: { d } }
  }

  const rx = shape.radii ? shape.radii[0] : shape.rx
  return {
    tag: 'rect',
    attrs: { x: shape.x, y: shape.y, width: shape.width, height: shape.height, rx },
  }
}
