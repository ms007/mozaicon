import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import type { RectShape } from '@/types/shapes'

import { activeDragAtom, cancelDraftAtom, draftShapeAtom } from './draft'

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

describe('activeDragAtom', () => {
  it('starts null', () => {
    const store = makeStore()
    expect(store.get(activeDragAtom)).toBeNull()
  })

  it('can hold drag state', () => {
    const store = makeStore()
    const drag = {
      toolId: 'rect',
      pointerId: 1,
      startViewBox: { x: 5, y: 5 },
      startScreen: { x: 100, y: 100 },
    }
    store.set(activeDragAtom, drag)
    expect(store.get(activeDragAtom)).toEqual(drag)
  })
})

describe('cancelDraftAtom', () => {
  it('resets both draftShapeAtom and activeDragAtom', () => {
    const store = makeStore()
    store.set(draftShapeAtom, draftRect)
    store.set(activeDragAtom, {
      toolId: 'rect',
      pointerId: 1,
      startViewBox: { x: 0, y: 0 },
      startScreen: { x: 0, y: 0 },
    })

    store.set(cancelDraftAtom)

    expect(store.get(draftShapeAtom)).toBeNull()
    expect(store.get(activeDragAtom)).toBeNull()
  })
})
