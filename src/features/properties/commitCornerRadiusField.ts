import { atom } from 'jotai'

import { selectedShapesAtom } from '@/store/atoms/selection'
import { setCornerRadiusCommand } from '@/store/commands/setCornerRadius'

export type CornerRadiusFieldKey = 'uniform' | 'tl' | 'tr' | 'br' | 'bl'

export const cornerIndexMap: Record<Exclude<CornerRadiusFieldKey, 'uniform'>, 0 | 1 | 2 | 3> = {
  tl: 0,
  tr: 1,
  br: 2,
  bl: 3,
}

export const commitCornerRadiusFieldAtom = atom(
  null,
  (get, set, payload: { field: CornerRadiusFieldKey; value: number }) => {
    const shapes = get(selectedShapesAtom)
    if (shapes.length === 0) return

    if (payload.field === 'uniform') {
      set(setCornerRadiusCommand, { radius: payload.value })
    } else {
      set(setCornerRadiusCommand, { corner: cornerIndexMap[payload.field], radius: payload.value })
    }
  },
)
