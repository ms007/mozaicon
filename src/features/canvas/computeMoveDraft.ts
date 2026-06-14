import type { Vec2 } from '@/lib/geometry/vec2'
import { quantize } from '@/lib/util/number'

export function computeMoveDraft(
  startPoint: Vec2,
  currentPoint: Vec2,
  shift: boolean,
): { dx: number; dy: number } {
  const dx = quantize(currentPoint.x - startPoint.x)
  const dy = quantize(currentPoint.y - startPoint.y)

  if (!shift) return { dx, dy }

  if (Math.abs(dx) >= Math.abs(dy)) {
    return { dx, dy: 0 }
  }
  return { dx: 0, dy }
}
