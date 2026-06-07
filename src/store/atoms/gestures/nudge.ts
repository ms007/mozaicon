import { createTranslationGesture } from './createTranslationGesture'

const nudge = createTranslationGesture('nudge')

export const nudgeDraftAtom = nudge.draftAtom
export const nudgeDraftForShapeAtom = nudge.draftForShapeAtom
export const nudgeAdapter = nudge.adapter
