import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import type { RectShape } from '@/types/shapes'

import { draftShapeAtom } from './draft'
import { isGestureActiveAtom } from './gesture'
import { moveDraftAtom } from './gestures/move'
import { marqueeDraftAtom } from './marquee-draft'
import { resizeDraftAtom } from './resize-draft'

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

describe('isGestureActiveAtom', () => {
  it('returns false when no gesture is active', () => {
    const store = createStore()
    expect(store.get(isGestureActiveAtom)).toBe(false)
  })

  it('returns true when draftShapeAtom is set', () => {
    const store = createStore()
    store.set(draftShapeAtom, draftRect)
    expect(store.get(isGestureActiveAtom)).toBe(true)
  })

  it('returns true when resizeDraftAtom is set', () => {
    const store = createStore()
    store.set(resizeDraftAtom, { shape1: { x: 0, y: 0, width: 10, height: 10 } })
    expect(store.get(isGestureActiveAtom)).toBe(true)
  })

  it('returns true when both draftShape and resizeDraft are set', () => {
    const store = createStore()
    store.set(draftShapeAtom, draftRect)
    store.set(resizeDraftAtom, { shape1: { x: 0, y: 0, width: 10, height: 10 } })
    expect(store.get(isGestureActiveAtom)).toBe(true)
  })

  it('remains true when draftShape is cleared but resizeDraft is active', () => {
    const store = createStore()
    store.set(draftShapeAtom, draftRect)
    store.set(resizeDraftAtom, { shape1: { x: 0, y: 0, width: 10, height: 10 } })
    store.set(draftShapeAtom, null)
    expect(store.get(isGestureActiveAtom)).toBe(true)
  })

  it('returns false after resizeDraft is cleared', () => {
    const store = createStore()
    store.set(resizeDraftAtom, { shape1: { x: 0, y: 0, width: 10, height: 10 } })
    store.set(resizeDraftAtom, null)
    expect(store.get(isGestureActiveAtom)).toBe(false)
  })

  it('stays false when only marqueeDraftAtom is set (marquee does not block commands)', () => {
    const store = createStore()
    store.set(marqueeDraftAtom, {
      pointerId: 1,
      startScreen: { x: 0, y: 0 },
      startViewBox: { x: 0, y: 0 },
      current: { x: 5, y: 5 },
      additive: false,
      baseSelection: [],
    })
    expect(store.get(isGestureActiveAtom)).toBe(false)
  })

  it('returns true when moveDraftAtom is set', () => {
    const store = createStore()
    store.set(moveDraftAtom, { ids: ['s1'], dx: 5, dy: 5 })
    expect(store.get(isGestureActiveAtom)).toBe(true)
  })

  it('returns false after moveDraftAtom is cleared', () => {
    const store = createStore()
    store.set(moveDraftAtom, { ids: ['s1'], dx: 5, dy: 5 })
    store.set(moveDraftAtom, null)
    expect(store.get(isGestureActiveAtom)).toBe(false)
  })

  it('returns false after draftShapeAtom is cleared', () => {
    const store = createStore()
    store.set(draftShapeAtom, draftRect)
    store.set(draftShapeAtom, null)
    expect(store.get(isGestureActiveAtom)).toBe(false)
  })
})
