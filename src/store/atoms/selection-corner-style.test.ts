import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Corners, CornerStyle, Icon, RectShape } from '@/types/shapes'

import { selectionCornerStyleAtom, selectionSmoothingAtom } from './selection-corner-style'
import { MIXED } from './selection-geometry'

function corners(overrides: Partial<Corners> = {}): Corners {
  return { ...DEFAULT_CORNERS, ...overrides }
}

const baseRect: RectShape = {
  id: 'r1',
  type: 'rect',
  name: 'Rect',
  visible: true,
  locked: false,
  x: 0,
  y: 0,
  width: 10,
  height: 8,
  corners: DEFAULT_CORNERS,
}

const baseDoc: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [baseRect],
}

function makeStore(doc: Icon = baseDoc, selectedIds: string[] = ['r1']) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  if (selectedIds.length > 0) {
    store.set(commitSelectionAtom, { ids: selectedIds, doc })
  }
  return store
}

function rect(id: string, style: CornerStyle, smoothing: number): RectShape {
  return { ...baseRect, id, corners: corners({ style, smoothing }) }
}

describe('selectionCornerStyleAtom', () => {
  it('returns null when no rects are selected', () => {
    const store = makeStore(baseDoc, [])
    expect(store.get(selectionCornerStyleAtom)).toBeNull()
  })

  it('returns the shared style for a single rect', () => {
    const store = makeStore({
      ...baseDoc,
      shapes: [rect('r1', 'smooth', 60)],
    })
    expect(store.get(selectionCornerStyleAtom)).toBe('smooth')
  })

  it('returns the shared style when all rects agree', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [rect('r1', 'smooth', 50), rect('r2', 'smooth', 80)],
    }
    const store = makeStore(doc, ['r1', 'r2'])
    expect(store.get(selectionCornerStyleAtom)).toBe('smooth')
  })

  it('returns MIXED when styles differ across selected rects', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [rect('r1', 'rounded', 0), rect('r2', 'smooth', 60)],
    }
    const store = makeStore(doc, ['r1', 'r2'])
    expect(store.get(selectionCornerStyleAtom)).toBe(MIXED)
  })

  it('returns default style for a rect with default corners', () => {
    const store = makeStore()
    expect(store.get(selectionCornerStyleAtom)).toBe('rounded')
  })
})

describe('selectionSmoothingAtom', () => {
  it('returns null when no rects are selected', () => {
    const store = makeStore(baseDoc, [])
    expect(store.get(selectionSmoothingAtom)).toBeNull()
  })

  it('returns the smoothing value for a single rect', () => {
    const store = makeStore({
      ...baseDoc,
      shapes: [rect('r1', 'smooth', 75)],
    })
    expect(store.get(selectionSmoothingAtom)).toBe(75)
  })

  it('returns the shared value when all rects agree', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [rect('r1', 'smooth', 40), rect('r2', 'smooth', 40)],
    }
    const store = makeStore(doc, ['r1', 'r2'])
    expect(store.get(selectionSmoothingAtom)).toBe(40)
  })

  it('returns MIXED when smoothing differs across selected rects', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [rect('r1', 'smooth', 20), rect('r2', 'smooth', 80)],
    }
    const store = makeStore(doc, ['r1', 'r2'])
    expect(store.get(selectionSmoothingAtom)).toBe(MIXED)
  })

  it('returns 0 for a rect with default corners', () => {
    const store = makeStore()
    expect(store.get(selectionSmoothingAtom)).toBe(0)
  })
})
