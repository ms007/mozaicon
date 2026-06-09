import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import type { Document, RectShape, Shape } from '@/types/shapes'

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
  corners: DEFAULT_CORNERS,
}

export function makeRect(overrides: Partial<RectShape> = {}): RectShape {
  return { ...baseRect, ...overrides }
}

export function makeDoc(shapes: Shape[] = [], overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-test',
    name: 'Test',
    viewBox: [0, 0, 24, 24],
    shapes,
    ...overrides,
  }
}
