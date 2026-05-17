import type { ShapeBase } from '@/types/shapes'

export function isSelectable(shape: Pick<ShapeBase, 'visible' | 'locked'>): boolean {
  return shape.visible && !shape.locked
}
