import { atom, createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import type { Icon } from '@/types/shapes'

import { type GestureAdapter, setGestureRegistryForTest } from './gestures/registry'
import { effectiveHoveredShapeIdAtom, hoveredShapeIdAtom } from './hover'
import { activeIconAtom } from './project'
import { commitSelectionAtom } from './selection'

const testDoc: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [
    {
      id: 'r1',
      name: 'Visible Rect',
      visible: true,
      locked: false,
      type: 'rect',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      corners: DEFAULT_CORNERS,
    },
    {
      id: 'r2',
      name: 'Hidden Rect',
      visible: false,
      locked: false,
      type: 'rect',
      x: 5,
      y: 5,
      width: 10,
      height: 10,
      corners: DEFAULT_CORNERS,
    },
    {
      id: 'r3',
      name: 'Another Visible',
      visible: true,
      locked: false,
      type: 'rect',
      x: 10,
      y: 10,
      width: 10,
      height: 10,
      corners: DEFAULT_CORNERS,
    },
  ],
}

function makeStore(doc: Icon = testDoc) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  return store
}

describe('hoveredShapeIdAtom', () => {
  it('defaults to null', () => {
    const store = makeStore()
    expect(store.get(hoveredShapeIdAtom)).toBeNull()
  })

  it('can be set and cleared', () => {
    const store = makeStore()
    store.set(hoveredShapeIdAtom, 'r1')
    expect(store.get(hoveredShapeIdAtom)).toBe('r1')
    store.set(hoveredShapeIdAtom, null)
    expect(store.get(hoveredShapeIdAtom)).toBeNull()
  })
})

describe('effectiveHoveredShapeIdAtom', () => {
  it('returns id for a visible, non-selected shape', () => {
    const store = makeStore()
    store.set(hoveredShapeIdAtom, 'r1')
    expect(store.get(effectiveHoveredShapeIdAtom)).toBe('r1')
  })

  it('returns null when hoveredShapeIdAtom is null', () => {
    const store = makeStore()
    expect(store.get(effectiveHoveredShapeIdAtom)).toBeNull()
  })

  it('suppresses when the hovered shape is selected', () => {
    const store = makeStore()
    const doc = store.get(activeIconAtom)
    store.set(commitSelectionAtom, { ids: ['r1'], doc })
    store.set(hoveredShapeIdAtom, 'r1')
    expect(store.get(effectiveHoveredShapeIdAtom)).toBeNull()
  })

  it('suppresses when the hovered shape is hidden', () => {
    const store = makeStore()
    store.set(hoveredShapeIdAtom, 'r2')
    expect(store.get(effectiveHoveredShapeIdAtom)).toBeNull()
  })

  it('suppresses when any gesture is active', () => {
    const draftAtom = atom<object | null>(null)
    const fakeAdapter: GestureAdapter<object> = {
      name: 'fake',
      draftAtom,
    }
    const restore = setGestureRegistryForTest([fakeAdapter])

    try {
      const store = makeStore()
      store.set(hoveredShapeIdAtom, 'r1')
      expect(store.get(effectiveHoveredShapeIdAtom)).toBe('r1')

      store.set(draftAtom, {})
      expect(store.get(effectiveHoveredShapeIdAtom)).toBeNull()
    } finally {
      restore()
    }
  })

  it('does not suppress for a non-blocking gesture (blocksCommands: false)', () => {
    const draftAtom = atom<object | null>(null)
    const nonBlockingAdapter: GestureAdapter<object> = {
      name: 'non-blocking',
      draftAtom,
      blocksCommands: false,
    }
    const restore = setGestureRegistryForTest([nonBlockingAdapter])

    try {
      const store = makeStore()
      store.set(hoveredShapeIdAtom, 'r1')
      store.set(draftAtom, {})
      expect(store.get(effectiveHoveredShapeIdAtom)).toBe('r1')
    } finally {
      restore()
    }
  })

  it('shows highlight for non-selected shape during multi-selection', () => {
    const store = makeStore()
    const doc = store.get(activeIconAtom)
    store.set(commitSelectionAtom, { ids: ['r1'], doc })
    store.set(hoveredShapeIdAtom, 'r3')
    expect(store.get(effectiveHoveredShapeIdAtom)).toBe('r3')
  })

  it('returns null for a nonexistent shape id', () => {
    const store = makeStore()
    store.set(hoveredShapeIdAtom, 'nonexistent')
    expect(store.get(effectiveHoveredShapeIdAtom)).toBeNull()
  })
})
