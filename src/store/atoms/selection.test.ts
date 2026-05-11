import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import type { Document } from '@/types/shapes'

import { documentAtom } from './document'
import {
  hasSelectionAtom,
  selectedIdsAtom,
  selectedShapesAtom,
  selectionBboxAtom,
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

  it('keeps array reference stable when an unrelated shape mutates', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])
    const before = store.get(selectedShapesAtom)

    // Mutate r2 (not selected) — selectedShapesAtom must not re-evaluate.
    store.set(documentAtom, (draft) => {
      const r2 = draft.shapes.find((s) => s.id === 'r2')
      if (r2) r2.name = 'Renamed'
    })

    expect(store.get(selectedShapesAtom)).toBe(before)
  })

  it('returns a new array when a selected shape mutates', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])
    const before = store.get(selectedShapesAtom)

    store.set(documentAtom, (draft) => {
      const r1 = draft.shapes.find((s) => s.id === 'r1')
      if (r1) r1.name = 'Renamed'
    })

    const after = store.get(selectedShapesAtom)
    expect(after).not.toBe(before)
    expect(after[0]).toMatchObject({ id: 'r1', name: 'Renamed' })
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

describe('selectionBboxAtom', () => {
  it('returns null when the selection is empty', () => {
    const store = makeStore()
    expect(store.get(selectionBboxAtom)).toBeNull()
  })

  it('returns null when all selected ids are stale', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['gone1', 'gone2'])
    expect(store.get(selectionBboxAtom)).toBeNull()
  })

  it('returns the bbox of a single selected shape', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])
    expect(store.get(selectionBboxAtom)).toEqual({ x: 0, y: 0, width: 10, height: 10 })
  })

  it('returns the union bbox of multiple selected shapes', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1', 'r2'])
    expect(store.get(selectionBboxAtom)).toEqual({ x: 0, y: 0, width: 15, height: 15 })
  })

  it('ignores stale ids in a mixed selection', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1', 'deleted-id'])
    expect(store.get(selectionBboxAtom)).toEqual({ x: 0, y: 0, width: 10, height: 10 })
  })

  it('keeps the bbox reference stable when a non-geometry field of a selected shape changes', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])
    const before = store.get(selectionBboxAtom)

    store.set(documentAtom, (draft) => {
      const r1 = draft.shapes.find((s) => s.id === 'r1')
      if (r1) r1.name = 'Renamed'
    })

    expect(store.get(selectionBboxAtom)).toBe(before)
  })

  it('returns a new bbox when a selected shape actually moves', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1'])
    const before = store.get(selectionBboxAtom)

    store.set(documentAtom, (draft) => {
      const r1 = draft.shapes.find((s) => s.id === 'r1')
      if (r1?.type === 'rect') r1.x = 100
    })

    const after = store.get(selectionBboxAtom)
    expect(after).not.toBe(before)
    expect(after).toEqual({ x: 100, y: 0, width: 10, height: 10 })
  })
})
