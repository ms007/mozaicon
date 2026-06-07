import { assertNever } from '@/lib/util/assertNever'
import type { Document, Shape, ShapeBase } from '@/types/shapes'

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

export interface ShapeElement {
  tag: 'rect' | 'path'
  attrs: Record<string, string | number | undefined>
}

function shapeToElement(shape: Shape): ShapeElement {
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  switch (shape.type) {
    case 'rect': {
      const el = chooseRectElement(shape)
      return { tag: el.tag, attrs: { ...el.attrs, ...shapePaintAttrs(shape) } }
    }
    default:
      return assertNever(shape.type)
  }
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}

export function documentElements(doc: Document): ShapeElement[] {
  return doc.shapes.filter((s) => s.visible).map(shapeToElement)
}
