import type { Vec2 } from '@/lib/geometry/vec2'

import { createDragTool } from './createDragTool'
import type { Modifiers } from './registry'

const DEFAULT_SIZE = 4

type RectGeometry = { x: number; y: number; width: number; height: number }

export function geometryFromDrag(start: Vec2, end: Vec2, modifiers: Modifiers): RectGeometry {
  let dx = end.x - start.x
  let dy = end.y - start.y

  if (modifiers.shift) {
    const size = Math.max(Math.abs(dx), Math.abs(dy))
    dx = Math.sign(dx || 1) * size
    dy = Math.sign(dy || 1) * size
  }

  if (modifiers.alt) {
    return {
      x: start.x - Math.abs(dx),
      y: start.y - Math.abs(dy),
      width: Math.max(1, 2 * Math.abs(dx)),
      height: Math.max(1, 2 * Math.abs(dy)),
    }
  }

  return {
    x: Math.min(start.x, start.x + dx),
    y: Math.min(start.y, start.y + dy),
    width: Math.max(1, Math.abs(dx)),
    height: Math.max(1, Math.abs(dy)),
  }
}

export const rectTool = createDragTool<RectGeometry>({
  toolId: 'rect',
  cursorClass: 'cursor-crosshair',
  geometryFromDrag,
  clickFallbackGeometry: (point) => ({
    x: point.x,
    y: point.y,
    width: DEFAULT_SIZE,
    height: DEFAULT_SIZE,
  }),
  geometryEquals: (a, b) =>
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height,
  buildShape: (geo, styles) => ({
    type: 'rect' as const,
    ...styles,
    ...geo,
  }),
})
