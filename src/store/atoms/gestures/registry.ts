import type { Getter, PrimitiveAtom } from 'jotai'
import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { type Rect, rectEqual } from '@/lib/geometry/rect'
import { selectionBboxAtom } from '@/store/atoms/selection'

import { drawAdapter } from './draw'
import { marqueeAdapter } from './marquee'
import { moveAdapter } from './move'
import { resizeAdapter } from './resize'

export type DisplayContribution =
  | { kind: 'rect'; value: Rect }
  | { kind: 'hide' }
  | { kind: 'passThrough' }

export type GestureAdapter<D = unknown> = {
  name: string
  draftAtom: PrimitiveAtom<D | null>
  displayBbox?: (draft: D, get: Getter) => DisplayContribution
}

// Order encodes display-bbox precedence: the first active adapter wins.
// Marquee shows the live preview rect; Resize shows draft handles; Move
// translates the static bbox; Draw shows the growing shape.
export const gestureRegistry = [
  marqueeAdapter,
  resizeAdapter,
  moveAdapter,
  drawAdapter,
] as readonly GestureAdapter[]

export const isAnyGestureActiveAtom = atom((get) =>
  gestureRegistry.some((adapter) => get(adapter.draftAtom) !== null),
)

const rawDisplayedSelectionBboxFromRegistryAtom = atom((get) => {
  for (const adapter of gestureRegistry) {
    const draft = get(adapter.draftAtom)
    if (draft == null) continue

    if (!adapter.displayBbox) return get(selectionBboxAtom)

    const contribution = adapter.displayBbox(draft, get)
    switch (contribution.kind) {
      case 'rect':
        return contribution.value
      case 'hide':
        return null
      case 'passThrough':
        continue
    }
  }
  return get(selectionBboxAtom)
})

export const displayedSelectionBboxFromRegistryAtom = selectAtom(
  rawDisplayedSelectionBboxFromRegistryAtom,
  (bbox) => bbox,
  rectEqual,
)

export const cancelGesturesAtom = atom(null, (_get, set) => {
  for (const adapter of gestureRegistry) {
    set(adapter.draftAtom, null)
  }
})

// Test-only: swap the registry contents and return a restore callback.
// Keeps the cast that defeats `readonly` localised to one place.
export function setGestureRegistryForTest<D>(adapters: readonly GestureAdapter<D>[]): () => void {
  const mutable = gestureRegistry as GestureAdapter[]
  const original = mutable.slice()
  mutable.length = 0
  for (const a of adapters) mutable.push(a as GestureAdapter)
  return () => {
    mutable.length = 0
    for (const a of original) mutable.push(a)
  }
}
