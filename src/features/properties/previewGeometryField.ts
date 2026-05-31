import { atom } from 'jotai'

import type { Rect } from '@/lib/geometry/rect'
import { bboxOf } from '@/lib/svg/bbox'
import { propertyStepDraftAtom } from '@/store/atoms/gestures/propertyStep'
import { selectedShapesAtom } from '@/store/atoms/selection'

import type { GeometryKey } from './commitGeometryField'

export const previewGeometryFieldAtom = atom(
  null,
  (get, set, payload: { field: GeometryKey; value: number }) => {
    const shapes = get(selectedShapesAtom)
    if (shapes.length === 0) return
    const draft: Record<string, Rect> = {}
    for (const shape of shapes) {
      draft[shape.id] = { ...bboxOf(shape), [payload.field]: payload.value }
    }
    set(propertyStepDraftAtom, draft)
  },
)

export const clearGeometryPreviewAtom = atom(null, (_get, set) => {
  set(propertyStepDraftAtom, null)
})
