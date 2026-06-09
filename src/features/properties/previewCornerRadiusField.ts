import { atom } from 'jotai'

import { clampRadii } from '@/lib/geometry/corner-radius'
import { cornerRadiusStepDraftAtom } from '@/store/atoms/gestures/cornerRadiusStep'
import { selectedShapesAtom } from '@/store/atoms/selection'
import type { Radii } from '@/types/shapes'

import { cornerIndexMap, type CornerRadiusFieldKey } from './commitCornerRadiusField'

export const previewCornerRadiusFieldAtom = atom(
  null,
  (get, set, payload: { field: CornerRadiusFieldKey; value: number }) => {
    const shapes = get(selectedShapesAtom)
    if (shapes.length === 0) return

    const draft: Record<string, Radii> = {}
    for (const shape of shapes) {
      /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
      if (shape.type !== 'rect') continue
      /* eslint-enable @typescript-eslint/no-unnecessary-condition */

      const radii = shape.corners.radii
      let next: Radii

      if (payload.field === 'uniform') {
        const r = payload.value
        next = [r, r, r, r]
      } else {
        next = [...radii] as Radii
        next[cornerIndexMap[payload.field]] = payload.value
      }

      draft[shape.id] = clampRadii(next, shape.width, shape.height)
    }

    set(cornerRadiusStepDraftAtom, draft)
  },
)

export const clearCornerRadiusPreviewAtom = atom(null, (_get, set) => {
  set(cornerRadiusStepDraftAtom, null)
})
