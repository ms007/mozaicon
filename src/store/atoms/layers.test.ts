import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import type { Document } from '@/types/shapes'

import { documentAtom } from './document'
import { layerAtom, layerIdsAtom } from './layers'

const testDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [
    {
      id: 'r1',
      name: 'Bottom Rect',
      visible: true,
      locked: false,
      type: 'rect',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    },
    {
      id: 'r2',
      name: 'Middle Rect',
      visible: false,
      locked: false,
      type: 'rect',
      x: 5,
      y: 5,
      width: 10,
      height: 10,
    },
    {
      id: 'r3',
      name: 'Top Rect',
      visible: true,
      locked: false,
      type: 'rect',
      x: 10,
      y: 10,
      width: 10,
      height: 10,
    },
  ],
}

function makeStore(doc: Document = testDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

describe('layerIdsAtom', () => {
  it('returns shape ids in reverse z-order (topmost first)', () => {
    const store = makeStore()
    expect(store.get(layerIdsAtom)).toEqual(['r3', 'r2', 'r1'])
  })

  it('returns an empty array for an empty document', () => {
    const store = makeStore({
      id: 'doc-empty',
      name: 'Empty',
      viewBox: [0, 0, 24, 24],
      shapes: [],
    })
    expect(store.get(layerIdsAtom)).toEqual([])
  })

  it('updates when shapes are removed', () => {
    const store = makeStore()
    expect(store.get(layerIdsAtom)).toEqual(['r3', 'r2', 'r1'])

    store.set(documentAtom, (draft) => {
      draft.shapes.splice(1, 1)
    })
    expect(store.get(layerIdsAtom)).toEqual(['r3', 'r1'])
  })

  it('preserves referential identity when only geometry changes', () => {
    const store = makeStore()
    const before = store.get(layerIdsAtom)

    store.set(documentAtom, (draft) => {
      const s = draft.shapes.find((s) => s.id === 'r1')
      if (s) s.x = 99
    })

    expect(store.get(layerIdsAtom)).toBe(before)
  })

  it('updates when shapes are added', () => {
    const store = makeStore({
      id: 'doc-1',
      name: 'One',
      viewBox: [0, 0, 24, 24],
      shapes: [
        {
          id: 'a',
          name: 'A',
          visible: true,
          locked: false,
          type: 'rect',
          x: 0,
          y: 0,
          width: 5,
          height: 5,
        },
      ],
    })
    expect(store.get(layerIdsAtom)).toEqual(['a'])

    store.set(documentAtom, (draft) => {
      draft.shapes.push({
        id: 'b',
        name: 'B',
        visible: true,
        locked: false,
        type: 'rect',
        x: 0,
        y: 0,
        width: 5,
        height: 5,
      })
    })
    expect(store.get(layerIdsAtom)).toEqual(['b', 'a'])
  })
})

describe('layerAtom', () => {
  it('returns { id, name, visible, locked, type } for a known shape', () => {
    const store = makeStore()
    expect(store.get(layerAtom('r2'))).toEqual({
      id: 'r2',
      name: 'Middle Rect',
      visible: false,
      locked: false,
      type: 'rect',
    })
  })

  it('returns undefined for an unknown id', () => {
    const store = makeStore()
    expect(store.get(layerAtom('nonexistent'))).toBeUndefined()
  })

  it('reflects a name change without affecting other layer atoms', () => {
    const store = makeStore()
    const before1 = store.get(layerAtom('r1'))
    const before3 = store.get(layerAtom('r3'))

    store.set(documentAtom, (draft) => {
      const s = draft.shapes.find((s) => s.id === 'r2')
      if (s) s.name = 'Renamed'
    })

    expect(store.get(layerAtom('r2'))).toEqual({
      id: 'r2',
      name: 'Renamed',
      visible: false,
      locked: false,
      type: 'rect',
    })
    // Other layers unchanged (referential stability from Immer)
    expect(store.get(layerAtom('r1'))).toEqual(before1)
    expect(store.get(layerAtom('r3'))).toEqual(before3)
  })

  it('preserves referential identity when only geometry changes', () => {
    const store = makeStore()
    const before = store.get(layerAtom('r1'))

    store.set(documentAtom, (draft) => {
      const s = draft.shapes.find((s) => s.id === 'r1')
      if (s) s.x = 99
    })

    expect(store.get(layerAtom('r1'))).toBe(before)
  })

  it('returns undefined after a shape is removed', () => {
    const store = makeStore()
    expect(store.get(layerAtom('r2'))).toBeDefined()

    store.set(documentAtom, (draft) => {
      draft.shapes = draft.shapes.filter((s) => s.id !== 'r2')
    })
    expect(store.get(layerAtom('r2'))).toBeUndefined()
  })

  it('reflects a visibility change', () => {
    const store = makeStore()
    store.set(documentAtom, (draft) => {
      const s = draft.shapes.find((s) => s.id === 'r1')
      if (s) s.visible = false
    })

    expect(store.get(layerAtom('r1'))?.visible).toBe(false)
  })
})
