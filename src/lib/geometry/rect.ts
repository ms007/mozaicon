import type { Vec2 } from './vec2'

export type Rect = { x: number; y: number; width: number; height: number }

export function rectFromPoints(a: Vec2, b: Vec2): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  }
}

export function unionRects(rects: readonly Rect[]): Rect | null {
  if (rects.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const r of rects) {
    minX = Math.min(minX, r.x)
    minY = Math.min(minY, r.y)
    maxX = Math.max(maxX, r.x + r.width)
    maxY = Math.max(maxY, r.y + r.height)
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function translateRect(rect: Rect, dx: number, dy: number): Rect {
  return { x: rect.x + dx, y: rect.y + dy, width: rect.width, height: rect.height }
}

export function rectEqual(a: Rect | null, b: Rect | null): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}
