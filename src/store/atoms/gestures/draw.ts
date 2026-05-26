import { atom } from 'jotai'

import { bboxOf } from '@/lib/svg/bbox'
import type { Shape } from '@/types/shapes'

import type { DisplayContribution, GestureAdapter } from './registry'

export const DRAFT_SHAPE_ID = '__draft__'

export const draftShapeAtom = atom<Shape | null>(null)

function drawDisplayBbox(draft: Shape): DisplayContribution {
  return { kind: 'rect', value: bboxOf(draft) }
}

export const drawAdapter: GestureAdapter<Shape> = {
  name: 'draw',
  draftAtom: draftShapeAtom,
  displayBbox: drawDisplayBbox,
}
