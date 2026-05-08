import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import type { Document } from '@/types/shapes'

import { documentAtom } from './document'
import { hasSelectionAtom, selectedIdsAtom, selectedShapesAtom } from './selection'

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
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      fill: '#000',
    },
    {
      id: 'r2',
      name: 'Rect 2',
      visible: true,
      locked: false,
      type: 'rect',
      x: 5,
      y: 5,
      width: 10,
      height: 10,
      fill: '#f00',
    },
  ],
}

function makeStore(doc: Document = testDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

describe('selectedIdsAtom', () => {
  it('starts empty', () => {
    const store = makeStore()
    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('can be set to an array of ids', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])
    expect(store.get(selectedIdsAtom)).toEqual(['r1'])
  })
})

describe('selectedShapesAtom', () => {
  it('resolves ids to shape objects', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])
    const shapes = store.get(selectedShapesAtom)
    expect(shapes).toHaveLength(1)
    expect(shapes[0].id).toBe('r1')
  })

  it('filters out stale ids that no longer exist in the document', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1', 'deleted-id', 'r2'])
    const shapes = store.get(selectedShapesAtom)
    expect(shapes).toHaveLength(2)
    expect(shapes.map((s) => s.id)).toEqual(['r1', 'r2'])
  })

  it('returns empty when all ids are stale', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['gone1', 'gone2'])
    expect(store.get(selectedShapesAtom)).toEqual([])
  })
})

describe('hasSelectionAtom', () => {
  it('is false when empty', () => {
    const store = makeStore()
    expect(store.get(hasSelectionAtom)).toBe(false)
  })

  it('is true when ids are set', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])
    expect(store.get(hasSelectionAtom)).toBe(true)
  })
})
