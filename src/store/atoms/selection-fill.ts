import { atom } from 'jotai'

import type { ShapeBase } from '@/types/shapes'

import { selectedShapesAtom } from './selection'
import { MIXED } from './selection-geometry'

export type FillPresence = 'all' | 'some' | 'none'

export type SelectionFill = {
  presence: FillPresence
  color: string | undefined
} | null

function hasFill(shape: ShapeBase): boolean {
  return shape.fill !== undefined && shape.fill !== 'none'
}

export const selectionFillAtom = atom<SelectionFill>((get) => {
  const shapes = get(selectedShapesAtom)
  if (shapes.length === 0) return null

  const filled = shapes.filter(hasFill)

  const presence: FillPresence =
    filled.length === 0 ? 'none' : filled.length === shapes.length ? 'all' : 'some'

  if (filled.length === 0) {
    return { presence, color: undefined }
  }

  const firstColor = filled[0].fill ?? ''
  let color: string = firstColor
  for (let i = 1; i < filled.length; i++) {
    if (filled[i].fill !== firstColor) {
      color = MIXED
      break
    }
  }

  return { presence, color }
})
