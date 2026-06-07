import { createTranslationGesture } from './createTranslationGesture'

const move = createTranslationGesture('move')

export const moveDraftAtom = move.draftAtom
export const isMovingAtom = move.isActiveAtom
export const moveDraftForShapeAtom = move.draftForShapeAtom
export const moveAdapter = move.adapter
