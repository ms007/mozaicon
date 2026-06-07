import { createTranslationGesture } from './createTranslationGesture'

const nudge = createTranslationGesture('nudge')

export const nudgeDraftAtom = nudge.draftAtom
export const isNudgingAtom = nudge.isActiveAtom
export const nudgeDraftForShapeAtom = nudge.draftForShapeAtom
export const nudgeAdapter = nudge.adapter
