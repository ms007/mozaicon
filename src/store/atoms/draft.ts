import { atom } from 'jotai'

import type { Shape } from '@/types/shapes'

export const DRAFT_SHAPE_ID = '__draft__'

export type ActiveDrag = {
  toolId: string
  pointerId: number
  startViewBox: { x: number; y: number }
  startScreen: { x: number; y: number }
}

export const draftShapeAtom = atom<Shape | null>(null)
export const activeDragAtom = atom<ActiveDrag | null>(null)

export const cancelDraftAtom = atom(null, (_get, set) => {
  set(draftShapeAtom, null)
  set(activeDragAtom, null)
})
