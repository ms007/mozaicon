import type { Vec2 } from './vec2'

export function screenDistance(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Below this many screen-pixels the gesture is a click, not a drag. */
export const DRAG_THRESHOLD_PX = 3
