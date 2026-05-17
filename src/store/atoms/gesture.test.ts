import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { type ActiveDrag, activeDragAtom } from './draft'
import { isGestureActiveAtom } from './gesture'
import { marqueeDraftAtom } from './marquee-draft'
import { resizeDraftAtom } from './resize-draft'

describe('isGestureActiveAtom', () => {
  it('returns false when no gesture is active', () => {
    const store = createStore()
    expect(store.get(isGestureActiveAtom)).toBe(false)
  })

  it('returns true when activeDragAtom is set', () => {
    const store = createStore()
    const drag: ActiveDrag = {
      toolId: 'rect',
      pointerId: 1,
      startViewBox: { x: 0, y: 0 },
      startScreen: { x: 0, y: 0 },
    }
    store.set(activeDragAtom, drag)
    expect(store.get(isGestureActiveAtom)).toBe(true)
  })

  it('returns true when resizeDraftAtom is set', () => {
    const store = createStore()
    store.set(resizeDraftAtom, { shape1: { x: 0, y: 0, width: 10, height: 10 } })
    expect(store.get(isGestureActiveAtom)).toBe(true)
  })

  it('returns true when both activeDrag and resizeDraft are set', () => {
    const store = createStore()
    const drag: ActiveDrag = {
      toolId: 'rect',
      pointerId: 1,
      startViewBox: { x: 0, y: 0 },
      startScreen: { x: 0, y: 0 },
    }
    store.set(activeDragAtom, drag)
    store.set(resizeDraftAtom, { shape1: { x: 0, y: 0, width: 10, height: 10 } })
    expect(store.get(isGestureActiveAtom)).toBe(true)
  })

  it('remains true when activeDrag is cleared but resizeDraft is active', () => {
    const store = createStore()
    const drag: ActiveDrag = {
      toolId: 'rect',
      pointerId: 1,
      startViewBox: { x: 0, y: 0 },
      startScreen: { x: 0, y: 0 },
    }
    store.set(activeDragAtom, drag)
    store.set(resizeDraftAtom, { shape1: { x: 0, y: 0, width: 10, height: 10 } })
    store.set(activeDragAtom, null)
    expect(store.get(isGestureActiveAtom)).toBe(true)
  })

  it('returns false after resizeDraft is cleared', () => {
    const store = createStore()
    store.set(resizeDraftAtom, { shape1: { x: 0, y: 0, width: 10, height: 10 } })
    store.set(resizeDraftAtom, null)
    expect(store.get(isGestureActiveAtom)).toBe(false)
  })

  it('returns true when marqueeDraftAtom is set', () => {
    const store = createStore()
    store.set(marqueeDraftAtom, {
      pointerId: 1,
      startScreen: { x: 0, y: 0 },
      startViewBox: { x: 0, y: 0 },
      current: { x: 5, y: 5 },
      additive: false,
      baseSelection: [],
    })
    expect(store.get(isGestureActiveAtom)).toBe(true)
  })

  it('returns false after marqueeDraftAtom is cleared', () => {
    const store = createStore()
    store.set(marqueeDraftAtom, {
      pointerId: 1,
      startScreen: { x: 0, y: 0 },
      startViewBox: { x: 0, y: 0 },
      current: { x: 5, y: 5 },
      additive: false,
      baseSelection: [],
    })
    store.set(marqueeDraftAtom, null)
    expect(store.get(isGestureActiveAtom)).toBe(false)
  })
})
