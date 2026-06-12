import { atom } from 'jotai'

import { selectedShapesAtom } from '@/store/atoms/selection'
import { setStrokeWidthCommand } from '@/store/commands/setStrokeWidth'

export const commitStrokeWidthAtom = atom(null, (get, set, width: number) => {
  const shapes = get(selectedShapesAtom)
  if (shapes.length === 0) return
  set(setStrokeWidthCommand, width)
})
