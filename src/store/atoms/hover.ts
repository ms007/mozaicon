import { atom } from 'jotai'

import { shapeAtom } from './document'
import { isAnyGestureActiveAtom } from './gestures/registry'
import { selectedIdsAtom } from './selection'

export const hoveredShapeIdAtom = atom<string | null>(null)

export const effectiveHoveredShapeIdAtom = atom((get) => {
  const id = get(hoveredShapeIdAtom)
  if (id == null) return null

  if (get(isAnyGestureActiveAtom)) return null

  const selectedIds = get(selectedIdsAtom)
  if (selectedIds.includes(id)) return null

  const shape = get(shapeAtom(id))
  if (!shape?.visible) return null

  return id
})
