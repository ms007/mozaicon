import { atom } from 'jotai'

import { activeDragAtom } from './draft'
import { marqueeDraftAtom } from './marquee-draft'
import { resizeDraftAtom } from './resize-draft'

export const isGestureActiveAtom = atom(
  (get) =>
    get(activeDragAtom) !== null || get(resizeDraftAtom) !== null || get(marqueeDraftAtom) !== null,
)
