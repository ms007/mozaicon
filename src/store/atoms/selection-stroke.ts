import { atom } from 'jotai'

import type { ShapeBase } from '@/types/shapes'

import { selectedShapesAtom } from './selection'
import { type FieldValue, MIXED } from './selection-geometry'

export type StrokePresence = 'all' | 'some' | 'none'

export type SelectionStroke = {
  presence: StrokePresence
  color: string | undefined
  width: FieldValue | undefined
} | null

function hasStroke(shape: ShapeBase): boolean {
  return shape.stroke !== undefined && shape.stroke !== 'none'
}

export const selectionStrokeAtom = atom<SelectionStroke>((get) => {
  const shapes = get(selectedShapesAtom)
  if (shapes.length === 0) return null

  const stroked = shapes.filter(hasStroke)

  const presence: StrokePresence =
    stroked.length === 0 ? 'none' : stroked.length === shapes.length ? 'all' : 'some'

  if (stroked.length === 0) {
    return { presence, color: undefined, width: undefined }
  }

  const firstColor = stroked[0].stroke ?? ''
  let color: string = firstColor
  for (let i = 1; i < stroked.length; i++) {
    if (stroked[i].stroke !== firstColor) {
      color = MIXED
      break
    }
  }

  const firstWidth = stroked[0].strokeWidth
  let width: FieldValue | undefined = firstWidth
  for (let i = 1; i < stroked.length; i++) {
    if (stroked[i].strokeWidth !== firstWidth) {
      width = MIXED
      break
    }
  }

  return { presence, color, width }
})
