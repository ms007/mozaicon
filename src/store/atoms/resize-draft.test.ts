import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { draftShapeAtom } from '@/store/atoms/draft'
import { moveDraftAtom } from '@/store/atoms/move-draft'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { makeRect } from '@/test/fixtures/shapes'
import type { Document } from '@/types/shapes'

import { displayedSelectionBboxAtom, resizeDraftAtom } from './resize-draft'

const testDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [
    {
      id: 'r1',
      name: 'Rect 1',
      visible: true,
      locked: false,
      type: 'rect',
      x: 2,
      y: 2,
      width: 4,
      height: 4,
      fill: '#000',
    },
    {
      id: 'r2',
      name: 'Rect 2',
      visible: true,
      locked: false,
      type: 'rect',
      x: 10,
      y: 10,
      width: 6,
      height: 6,
      fill: '#f00',
    },
  ],
}

function makeStore() {
  const store = createStore()
  store.set(documentAtom, testDoc)
  return store
}

describe('displayedSelectionBboxAtom', () => {
  it('returns the committed selection bbox when no draft is active', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1', 'r2'])

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 2,
      y: 2,
      width: 14,
      height: 14,
    })
  })

  it('tracks the draft union while a resize is in flight', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1', 'r2'])

    store.set(resizeDraftAtom, {
      r1: { x: 2, y: 2, width: 8, height: 8 },
      r2: { x: 18, y: 18, width: 12, height: 12 },
    })

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 2,
      y: 2,
      width: 28,
      height: 28,
    })
  })

  it('falls back to the committed bbox after the draft is cleared', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])

    store.set(resizeDraftAtom, { r1: { x: 0, y: 0, width: 20, height: 20 } })
    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 0,
      y: 0,
      width: 20,
      height: 20,
    })

    store.set(resizeDraftAtom, null)
    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 2,
      y: 2,
      width: 4,
      height: 4,
    })
  })

  it('returns null when nothing is selected and no draft is set', () => {
    const store = makeStore()
    expect(store.get(displayedSelectionBboxAtom)).toBeNull()
  })

  it('tracks the draw-draft shape bbox while a drag-to-draw is in flight', () => {
    const store = makeStore()
    store.set(draftShapeAtom, makeRect({ id: '__draft__', x: 5, y: 6, width: 7, height: 8 }))

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 5,
      y: 6,
      width: 7,
      height: 8,
    })
  })

  it('prefers the resize draft over the draw draft when both are set', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])
    store.set(resizeDraftAtom, { r1: { x: 0, y: 0, width: 20, height: 20 } })
    store.set(draftShapeAtom, makeRect({ id: '__draft__', x: 100, y: 100, width: 1, height: 1 }))

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 0,
      y: 0,
      width: 20,
      height: 20,
    })
  })

  it('falls back to the committed bbox after the draw draft is cleared', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])
    store.set(draftShapeAtom, makeRect({ id: '__draft__', x: 50, y: 50, width: 4, height: 4 }))

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 50,
      y: 50,
      width: 4,
      height: 4,
    })

    store.set(draftShapeAtom, null)
    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 2,
      y: 2,
      width: 4,
      height: 4,
    })
  })

  it('preserves referential identity when consecutive drafts yield the same union rect', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])

    store.set(resizeDraftAtom, { r1: { x: 0, y: 0, width: 10, height: 10 } })
    const first = store.get(displayedSelectionBboxAtom)

    store.set(resizeDraftAtom, { r1: { x: 0, y: 0, width: 10, height: 10 } })
    const second = store.get(displayedSelectionBboxAtom)

    expect(second).toBe(first)
  })

  it('returns the selection bbox shifted by move-draft offset', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])

    store.set(moveDraftAtom, { ids: ['r1'], dx: 5, dy: 3 })

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 7,
      y: 5,
      width: 4,
      height: 4,
    })
  })

  it('returns the selection bbox when move-draft is cleared', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])

    store.set(moveDraftAtom, { ids: ['r1'], dx: 5, dy: 3 })
    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 7,
      y: 5,
      width: 4,
      height: 4,
    })

    store.set(moveDraftAtom, null)
    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 2,
      y: 2,
      width: 4,
      height: 4,
    })
  })

  it('returns selection bbox when both resize-draft and move-draft are null', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1', 'r2'])

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 2,
      y: 2,
      width: 14,
      height: 14,
    })
  })

  it('prefers resize-draft over move-draft when both are set', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])

    store.set(resizeDraftAtom, { r1: { x: 0, y: 0, width: 20, height: 20 } })
    store.set(moveDraftAtom, { ids: ['r1'], dx: 100, dy: 100 })

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 0,
      y: 0,
      width: 20,
      height: 20,
    })
  })

  it('shifts multi-selection bbox by move-draft offset', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1', 'r2'])

    store.set(moveDraftAtom, { ids: ['r1', 'r2'], dx: -1, dy: 2 })

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 1,
      y: 4,
      width: 14,
      height: 14,
    })
  })

  it('returns null when move-draft is active but nothing is selected', () => {
    const store = makeStore()
    store.set(moveDraftAtom, { ids: ['nonexistent'], dx: 10, dy: 10 })

    expect(store.get(displayedSelectionBboxAtom)).toBeNull()
  })

  it('preserves referential identity when move-draft updates with same offset', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])

    const ids = ['r1']
    store.set(moveDraftAtom, { ids, dx: 3, dy: 4 })
    const first = store.get(displayedSelectionBboxAtom)

    store.set(moveDraftAtom, { ids, dx: 3, dy: 4 })
    const second = store.get(displayedSelectionBboxAtom)

    expect(second).toBe(first)
  })
})
