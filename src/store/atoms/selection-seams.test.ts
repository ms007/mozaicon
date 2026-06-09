import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import type { Document } from '@/types/shapes'

import { documentAtom } from './document'
import {
  commitSelectionAtom,
  restoreSelectionAtom,
  selectedIdsAtom,
  selectionEqual,
} from './selection'

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
      corners: DEFAULT_CORNERS,
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
      corners: DEFAULT_CORNERS,
    },
    {
      id: 'r3',
      name: 'Rect 3',
      visible: true,
      locked: false,
      type: 'rect',
      x: 10,
      y: 10,
      width: 10,
      height: 10,
      fill: '#0f0',
      corners: DEFAULT_CORNERS,
    },
  ],
}

function makeStore(doc: Document = testDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

describe('selectionEqual', () => {
  it('returns true for identical references', () => {
    const arr = ['a', 'b']
    expect(selectionEqual(arr, arr)).toBe(true)
  })

  it('returns true for equal arrays', () => {
    expect(selectionEqual(['a', 'b'], ['a', 'b'])).toBe(true)
  })

  it('returns false for different lengths', () => {
    expect(selectionEqual(['a'], ['a', 'b'])).toBe(false)
  })

  it('returns false for different contents', () => {
    expect(selectionEqual(['a', 'b'], ['a', 'c'])).toBe(false)
  })

  it('returns true for two empty arrays', () => {
    expect(selectionEqual([], [])).toBe(true)
  })
})

describe('commitSelectionAtom', () => {
  it('writes normalised ids and reports changed', () => {
    const store = makeStore()
    const result = store.set(commitSelectionAtom, { ids: ['r2', 'r1'], doc: testDoc })
    expect(result).toEqual({ changed: true, ids: ['r1', 'r2'] })
    expect(store.get(selectedIdsAtom)).toEqual(['r1', 'r2'])
  })

  it('deduplicates ids', () => {
    const store = makeStore()
    const result = store.set(commitSelectionAtom, { ids: ['r1', 'r1', 'r2'], doc: testDoc })
    expect(result).toEqual({ changed: true, ids: ['r1', 'r2'] })
    expect(store.get(selectedIdsAtom)).toEqual(['r1', 'r2'])
  })

  it('drops stale ids that are not in the document', () => {
    const store = makeStore()
    const result = store.set(commitSelectionAtom, { ids: ['r1', 'gone'], doc: testDoc })
    expect(result).toEqual({ changed: true, ids: ['r1'] })
    expect(store.get(selectedIdsAtom)).toEqual(['r1'])
  })

  it('sorts ids into document z-order', () => {
    const store = makeStore()
    const result = store.set(commitSelectionAtom, { ids: ['r3', 'r1', 'r2'], doc: testDoc })
    expect(result.ids).toEqual(['r1', 'r2', 'r3'])
  })

  it('returns changed:false and does not write when ids match prior value', () => {
    const store = makeStore()
    store.set(restoreSelectionAtom, ['r1', 'r2'])
    const before = store.get(selectedIdsAtom)
    const result = store.set(commitSelectionAtom, { ids: ['r1', 'r2'], doc: testDoc })
    expect(result).toEqual({ changed: false, ids: ['r1', 'r2'] })
    expect(store.get(selectedIdsAtom)).toBe(before)
  })

  it('returns empty ids and changed:false when all ids are stale and selection was already empty', () => {
    const store = makeStore()
    const result = store.set(commitSelectionAtom, { ids: ['gone1', 'gone2'], doc: testDoc })
    expect(result).toEqual({ changed: false, ids: [] })
  })

  it('returns empty ids and changed:true when all ids are stale and selection was non-empty', () => {
    const store = makeStore()
    store.set(restoreSelectionAtom, ['r1'])
    const result = store.set(commitSelectionAtom, { ids: ['gone1', 'gone2'], doc: testDoc })
    expect(result).toEqual({ changed: true, ids: [] })
    expect(store.get(selectedIdsAtom)).toEqual([])
  })
})

describe('restoreSelectionAtom', () => {
  it('writes the given ids verbatim', () => {
    const store = makeStore()
    store.set(restoreSelectionAtom, ['r2', 'r1'])
    expect(store.get(selectedIdsAtom)).toEqual(['r2', 'r1'])
  })

  it('overwrites prior selection', () => {
    const store = makeStore()
    store.set(restoreSelectionAtom, ['r1', 'r2'])
    store.set(restoreSelectionAtom, ['r3'])
    expect(store.get(selectedIdsAtom)).toEqual(['r3'])
  })

  it('can restore an empty selection', () => {
    const store = makeStore()
    store.set(restoreSelectionAtom, ['r1'])
    store.set(restoreSelectionAtom, [])
    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('does not normalise — stale ids are preserved as-is', () => {
    const store = makeStore()
    store.set(restoreSelectionAtom, ['gone', 'r1'])
    expect(store.get(selectedIdsAtom)).toEqual(['gone', 'r1'])
  })
})
