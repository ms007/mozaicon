import { atom } from 'jotai'

import type { Rect } from '@/lib/geometry/rect'
import { bboxOf } from '@/lib/svg/bbox'
import { selectedShapesAtom } from '@/store/atoms/selection'
import { resizeShapeCommand } from '@/store/commands/resizeShape'

export type GeometryKey = 'x' | 'y' | 'width' | 'height'

export const commitGeometryFieldAtom = atom(
  null,
  (get, set, payload: { field: GeometryKey; value: number }) => {
    const shapes = get(selectedShapesAtom)
    if (shapes.length === 0) return
    const resize: Record<string, Rect> = {}
    for (const shape of shapes) {
      resize[shape.id] = { ...bboxOf(shape), [payload.field]: payload.value }
    }
    set(resizeShapeCommand, resize)
  },
)
