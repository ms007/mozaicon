import { atom } from 'jotai'

import { bboxOf } from '@/lib/svg/bbox'
import type { Shape } from '@/types/shapes'

import { selectedShapesAtom } from './selection'

export const MIXED = 'mixed' as const
export type FieldValue = number | typeof MIXED

export type SelectionGeometry = {
  x: FieldValue
  y: FieldValue
  width: FieldValue
  height: FieldValue
} | null

function fieldValue(shapes: readonly Shape[], getter: (s: Shape) => number): FieldValue {
  const first = getter(shapes[0])
  for (let i = 1; i < shapes.length; i++) {
    if (getter(shapes[i]) !== first) return MIXED
  }
  return first
}

export const selectionGeometryAtom = atom<SelectionGeometry>((get) => {
  const shapes = get(selectedShapesAtom)
  if (shapes.length === 0) return null

  return {
    x: fieldValue(shapes, (s) => bboxOf(s).x),
    y: fieldValue(shapes, (s) => bboxOf(s).y),
    width: fieldValue(shapes, (s) => bboxOf(s).width),
    height: fieldValue(shapes, (s) => bboxOf(s).height),
  }
})
