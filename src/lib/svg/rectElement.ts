import { cornerPath } from '@/lib/geometry/corner-path'
import { isUniform } from '@/lib/geometry/corner-radius'
import type { RectShape } from '@/types/shapes'

export type RectElement =
  | { tag: 'rect'; attrs: { x: number; y: number; width: number; height: number; rx?: number } }
  | { tag: 'path'; attrs: { d: string } }

export function chooseRectElement(shape: RectShape): RectElement {
  const { radii, style, smoothing } = shape.corners
  const isSmooth = style === 'smooth'
  if (!isUniform(radii) || isSmooth) {
    const d = cornerPath(
      shape.x,
      shape.y,
      shape.width,
      shape.height,
      radii,
      isSmooth ? smoothing : 0,
    )
    return { tag: 'path', attrs: { d } }
  }

  const rx = radii[0] || undefined
  return {
    tag: 'rect',
    attrs: { x: shape.x, y: shape.y, width: shape.width, height: shape.height, rx },
  }
}
