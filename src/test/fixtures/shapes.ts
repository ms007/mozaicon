import type { RectShape } from '@/types/shapes'

const baseRect: RectShape = {
  id: 'r1',
  name: 'Rect',
  visible: true,
  locked: false,
  type: 'rect',
  x: 0,
  y: 0,
  width: 10,
  height: 10,
}

export function makeRect(overrides: Partial<RectShape> = {}): RectShape {
  return { ...baseRect, ...overrides }
}
