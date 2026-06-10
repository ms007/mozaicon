import { assertNever } from '@/lib/util/assertNever'
import type { Icon, Shape, ShapeBase } from '@/types/shapes'

import { chooseRectElement } from './rectElement'

export const DEFAULT_FILL = '#000'

export interface PaintAttrs {
  fill: string
  stroke?: string
  strokeWidth?: number
}

export function shapePaintAttrs(shape: ShapeBase): PaintAttrs {
  const fill = shape.fill ?? DEFAULT_FILL
  if (shape.stroke === undefined || shape.stroke === 'none') return { fill }
  return { fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth }
}

export interface RectElementAttrs {
  x: number
  y: number
  width: number
  height: number
  rx?: number
  fill: string
  stroke?: string
  strokeWidth?: number
}

export interface PathElementAttrs {
  d: string
  fill: string
  stroke?: string
  strokeWidth?: number
}

export type ShapeElement =
  | { tag: 'rect'; attrs: RectElementAttrs }
  | { tag: 'path'; attrs: PathElementAttrs }

export function shapeToElement(shape: Shape): ShapeElement {
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  switch (shape.type) {
    case 'rect': {
      const el = chooseRectElement(shape)
      const paint = shapePaintAttrs(shape)
      if (el.tag === 'path') {
        return { tag: 'path', attrs: { ...el.attrs, ...paint } }
      }
      return { tag: 'rect', attrs: { ...el.attrs, ...paint } }
    }
    default:
      return assertNever(shape.type)
  }
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}

export function iconElements(doc: Icon): ShapeElement[] {
  return doc.shapes.filter((s) => s.visible).map(shapeToElement)
}
