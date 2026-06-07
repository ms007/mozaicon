import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import type { RectShape } from '@/types/shapes'

import { cancelDraftAtom, draftShapeAtom } from './draft'
import { moveDraftAtom } from './gestures/move'
import { marqueeDraftAtom } from './marquee-draft'
import { resizeDraftAtom } from './resize-draft'

function makeStore() {
  return createStore()
}

const draftRect: RectShape = {
  type: 'rect',
  id: '__draft__',
  name: 'Rect',
  visible: true,
  locked: false,
  x: 2,
  y: 2,
  width: 8,
  height: 6,
  fill: '#000',
}

describe('draftShapeAtom', () => {
  it('starts null', () => {
    const store = makeStore()
    expect(store.get(draftShapeAtom)).toBeNull()
  })

  it('can hold a draft shape', () => {
    const store = makeStore()
    store.set(draftShapeAtom, draftRect)
    expect(store.get(draftShapeAtom)).toEqual(draftRect)
  })
})

describe('cancelDraftAtom', () => {
  it('clears all draft atoms in a single write', () => {
    const store = makeStore()
    store.set(draftShapeAtom, draftRect)
    store.set(marqueeDraftAtom, {
      pointerId: 1,
      startScreen: { x: 0, y: 0 },
      startViewBox: { x: 0, y: 0 },
      current: { x: 10, y: 10 },
      additive: false,
      baseSelection: [],
    })
    store.set(moveDraftAtom, { ids: ['s1'], dx: 5, dy: 5 })
    store.set(resizeDraftAtom, { s1: { x: 0, y: 0, width: 20, height: 20 } })

    store.set(cancelDraftAtom)

    expect(store.get(draftShapeAtom)).toBeNull()
    expect(store.get(marqueeDraftAtom)).toBeNull()
    expect(store.get(moveDraftAtom)).toBeNull()
    expect(store.get(resizeDraftAtom)).toBeNull()
  })
})
