import { atom } from 'jotai'

import { selectedShapesAtom } from '@/store/atoms/selection'
import { setStrokeColorCommand } from '@/store/commands/setStrokeColor'

export const commitStrokeColorAtom = atom(null, (get, set, color: string) => {
  const shapes = get(selectedShapesAtom)
  if (shapes.length === 0) return
  set(setStrokeColorCommand, color)
})
