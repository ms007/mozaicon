import type { Rect } from '@/lib/geometry/rect'
import type { Vec2 } from '@/lib/geometry/vec2'

export type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export function anchorForHandle(handle: HandlePosition, bbox: Rect): Vec2 {
  const { x, y, width, height } = bbox
  switch (handle) {
    case 'nw':
      return { x: x + width, y: y + height }
    case 'n':
      return { x: x + width / 2, y: y + height }
    case 'ne':
      return { x, y: y + height }
    case 'e':
      return { x, y: y + height / 2 }
    case 'se':
      return { x, y }
    case 's':
      return { x: x + width / 2, y }
    case 'sw':
      return { x: x + width, y }
    case 'w':
      return { x: x + width, y: y + height / 2 }
  }
}

export function bboxCenter(bbox: Rect): Vec2 {
  return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 }
}

export function isCornerHandle(handle: HandlePosition): boolean {
  return handle === 'nw' || handle === 'ne' || handle === 'se' || handle === 'sw'
}

export function scaleFactors(
  handle: HandlePosition,
  startPoint: Vec2,
  currentPoint: Vec2,
  bbox: Rect,
  useCenter = false,
): { sx: number; sy: number } {
  const dx = currentPoint.x - startPoint.x
  const dy = currentPoint.y - startPoint.y

  let sx = 1
  let sy = 1

  const isHorizontal = handle === 'e' || handle === 'w'
  const isVertical = handle === 'n' || handle === 's'

  const effWidth = useCenter ? bbox.width / 2 : bbox.width
  const effHeight = useCenter ? bbox.height / 2 : bbox.height

  if (!isVertical && effWidth !== 0) {
    const sign = handle === 'nw' || handle === 'w' || handle === 'sw' ? -1 : 1
    sx = (effWidth + sign * dx) / effWidth
  }

  if (!isHorizontal && effHeight !== 0) {
    const sign = handle === 'nw' || handle === 'n' || handle === 'ne' ? -1 : 1
    sy = (effHeight + sign * dy) / effHeight
  }

  return { sx, sy }
}
