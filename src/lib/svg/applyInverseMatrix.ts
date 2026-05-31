import type { Vec2 } from '@/lib/geometry/vec2'

export type AffineMatrix = {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

// Pure math — no DOM access.
export function applyInverseMatrix(inverse: AffineMatrix, screenPoint: Vec2): Vec2 {
  return {
    x: inverse.a * screenPoint.x + inverse.c * screenPoint.y + inverse.e,
    y: inverse.b * screenPoint.x + inverse.d * screenPoint.y + inverse.f,
  }
}
