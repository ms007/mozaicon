import type { Vec2 } from '@/lib/geometry/vec2'

export function screenToViewBox(svg: SVGSVGElement, clientX: number, clientY: number): Vec2 {
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: clientX, y: clientY }

  const inverse = ctm.inverse()
  return {
    x: inverse.a * clientX + inverse.c * clientY + inverse.e,
    y: inverse.b * clientX + inverse.d * clientY + inverse.f,
  }
}
