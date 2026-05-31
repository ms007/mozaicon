import type { Vec2 } from '@/lib/geometry/vec2'

import { applyInverseMatrix } from './applyInverseMatrix'

export function screenToViewBox(svg: SVGSVGElement, clientX: number, clientY: number): Vec2 {
  // Layout-forcing read — the only DOM access in the coordinate pipeline.
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: clientX, y: clientY }

  return applyInverseMatrix(ctm.inverse(), { x: clientX, y: clientY })
}
