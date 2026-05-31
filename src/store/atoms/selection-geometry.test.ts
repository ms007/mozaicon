import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { selectShapesCommand } from '@/store/commands/selectionCommands'
import type { Document } from '@/types/shapes'

import { documentAtom } from './document'
import { MIXED, selectionGeometryAtom } from './selection-geometry'

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
      y: 3,
      width: 10,
      height: 8,
      fill: '#000',
    },
    {
      id: 'r2',
      name: 'Rect 2',
      visible: true,
      locked: false,
      type: 'rect',
      x: 2,
      y: 5,
      width: 10,
      height: 12,
      fill: '#f00',
    },
    {
      id: 'r3',
      name: 'Rect 3',
      visible: true,
      locked: false,
      type: 'rect',
      x: 7,
      y: 9,
      width: 4,
      height: 4,
      fill: '#0f0',
    },
  ],
}

function makeStore(doc: Document = testDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

describe('selectionGeometryAtom', () => {
  it('returns null when nothing is selected', () => {
    const store = makeStore()
    expect(store.get(selectionGeometryAtom)).toBeNull()
  })

  it('returns exact geometry for a single selected shape', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])
    expect(store.get(selectionGeometryAtom)).toEqual({
      x: 2,
      y: 3,
      width: 10,
      height: 8,
    })
  })

  it('shows shared values when multi-selection agrees on a field', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1', 'r2'])
    const geo = store.get(selectionGeometryAtom)
    expect(geo).not.toBeNull()
    expect(geo?.x).toBe(2)
    expect(geo?.width).toBe(10)
  })

  it('shows MIXED when multi-selection disagrees on a field', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1', 'r2'])
    const geo = store.get(selectionGeometryAtom)
    expect(geo).not.toBeNull()
    expect(geo?.y).toBe(MIXED)
    expect(geo?.height).toBe(MIXED)
  })

  it('shows all MIXED when no fields agree across three shapes', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1', 'r2', 'r3'])
    const geo = store.get(selectionGeometryAtom)
    expect(geo).not.toBeNull()
    expect(geo?.x).toBe(MIXED)
    expect(geo?.y).toBe(MIXED)
    expect(geo?.width).toBe(MIXED)
    expect(geo?.height).toBe(MIXED)
  })

  it('returns zero values faithfully (not null or empty)', () => {
    const store = makeStore({
      id: 'doc-zero',
      name: 'Zero',
      viewBox: [0, 0, 24, 24],
      shapes: [
        {
          id: 'z1',
          name: 'Zero Rect',
          visible: true,
          locked: false,
          type: 'rect',
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        },
      ],
    })
    store.set(selectShapesCommand, ['z1'])
    const geo = store.get(selectionGeometryAtom)
    expect(geo).not.toBeNull()
    expect(geo?.x).toBe(0)
    expect(geo?.y).toBe(0)
    expect(geo?.width).toBe(0)
    expect(geo?.height).toBe(0)
  })

  it('preserves faithful values without rounding', () => {
    const store = makeStore({
      id: 'doc-precise',
      name: 'Precise',
      viewBox: [0, 0, 24, 24],
      shapes: [
        {
          id: 'p1',
          name: 'Precise Rect',
          visible: true,
          locked: false,
          type: 'rect',
          x: 1.123456789,
          y: 0.000001,
          width: 3.14159,
          height: 2.71828,
        },
      ],
    })
    store.set(selectShapesCommand, ['p1'])
    const geo = store.get(selectionGeometryAtom)
    expect(geo).not.toBeNull()
    expect(geo?.x).toBe(1.123456789)
    expect(geo?.y).toBe(0.000001)
    expect(geo?.width).toBe(3.14159)
    expect(geo?.height).toBe(2.71828)
  })
})
