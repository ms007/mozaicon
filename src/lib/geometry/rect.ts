export type Rect = { x: number; y: number; width: number; height: number }

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

export function rectEqual(a: Rect | null, b: Rect | null): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}
