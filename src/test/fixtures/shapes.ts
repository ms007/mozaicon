import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import type { Icon, Project, RectShape, Shape } from '@/types/shapes'

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

export function makeIcon(shapes: Shape[] = [], overrides: Partial<Icon> = {}): Icon {
  return {
    id: 'icon-test',
    name: 'Test',
    viewBox: [0, 0, 24, 24],
    shapes,
    ...overrides,
  }
}

export function makeProject(icons?: Icon[], overrides?: Partial<Project>): Project {
  const defaultIcon = makeIcon()
  return {
    id: 'proj-test',
    icons: icons ?? [defaultIcon],
    activeIconId: icons?.[0]?.id ?? defaultIcon.id,
    nextIconNumber: 1,
    ...overrides,
  }
}
