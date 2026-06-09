import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { documentAtom } from '@/store/atoms/document'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Corners, Document, RectShape } from '@/types/shapes'

import { selectionCornerRadiiAtom } from './selection-corner-radii'
import { MIXED } from './selection-geometry'

function corners(radii: [number, number, number, number]): Corners {
  return { ...DEFAULT_CORNERS, radii }
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

const baseDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [baseRect],
}

function makeStore(doc: Document = baseDoc, selectedIds: string[] = ['r1']) {
  const store = createStore()
  store.set(documentAtom, doc)
  if (selectedIds.length > 0) {
    store.set(commitSelectionAtom, { ids: selectedIds, doc })
  }
  return store
}

describe('selectionCornerRadiiAtom', () => {
  it('returns hasRects=false when no shapes are selected', () => {
    const store = makeStore(baseDoc, [])
    const result = store.get(selectionCornerRadiiAtom)
    expect(result.hasRects).toBe(false)
  })

  it('returns uniform corners for a rect with uniform radii', () => {
    const store = makeStore({
      ...baseDoc,
      shapes: [{ ...baseRect, corners: corners([3, 3, 3, 3]) }],
    })

    const result = store.get(selectionCornerRadiiAtom)
    expect(result.hasRects).toBe(true)
    expect(result.tl).toBe(3)
    expect(result.tr).toBe(3)
    expect(result.br).toBe(3)
    expect(result.bl).toBe(3)
  })

  it('returns 0 for all corners when rect has default corners', () => {
    const store = makeStore()

    const result = store.get(selectionCornerRadiiAtom)
    expect(result.hasRects).toBe(true)
    expect(result.tl).toBe(0)
    expect(result.tr).toBe(0)
    expect(result.br).toBe(0)
    expect(result.bl).toBe(0)
  })

  it('returns per-corner values from corners radii', () => {
    const store = makeStore({
      ...baseDoc,
      shapes: [{ ...baseRect, corners: corners([1, 2, 3, 4]) }],
    })

    const result = store.get(selectionCornerRadiiAtom)
    expect(result.hasRects).toBe(true)
    expect(result.tl).toBe(1)
    expect(result.tr).toBe(2)
    expect(result.br).toBe(3)
    expect(result.bl).toBe(4)
  })

  it('returns MIXED when corners differ across selected rects', () => {
    const doc: Document = {
      ...baseDoc,
      shapes: [
        { ...baseRect, corners: corners([2, 2, 2, 2]) },
        { ...baseRect, id: 'r2', corners: corners([5, 5, 5, 5]) },
      ],
    }
    const store = makeStore(doc, ['r1', 'r2'])

    const result = store.get(selectionCornerRadiiAtom)
    expect(result.hasRects).toBe(true)
    expect(result.tl).toBe(MIXED)
    expect(result.tr).toBe(MIXED)
    expect(result.br).toBe(MIXED)
    expect(result.bl).toBe(MIXED)
  })

  it('returns consistent values across rects with matching corners', () => {
    const doc: Document = {
      ...baseDoc,
      shapes: [
        { ...baseRect, corners: corners([3, 3, 3, 3]) },
        { ...baseRect, id: 'r2', corners: corners([3, 3, 3, 3]) },
      ],
    }
    const store = makeStore(doc, ['r1', 'r2'])

    const result = store.get(selectionCornerRadiiAtom)
    expect(result.tl).toBe(3)
    expect(result.tr).toBe(3)
    expect(result.br).toBe(3)
    expect(result.bl).toBe(3)
  })

  it('returns MIXED per-corner when only some corners differ across rects', () => {
    const doc: Document = {
      ...baseDoc,
      shapes: [
        { ...baseRect, corners: corners([2, 3, 2, 2]) },
        { ...baseRect, id: 'r2', corners: corners([2, 5, 2, 2]) },
      ],
    }
    const store = makeStore(doc, ['r1', 'r2'])

    const result = store.get(selectionCornerRadiiAtom)
    expect(result.tl).toBe(2)
    expect(result.tr).toBe(MIXED)
    expect(result.br).toBe(2)
    expect(result.bl).toBe(2)
  })

  it('ignores non-rect shapes in the selection', () => {
    const store = makeStore({
      ...baseDoc,
      shapes: [{ ...baseRect, corners: corners([3, 3, 3, 3]) }],
    })

    const result = store.get(selectionCornerRadiiAtom)
    expect(result.hasRects).toBe(true)
    expect(result.tl).toBe(3)
  })

  it('returns hasRects=false when selection contains only non-rect shapes', () => {
    const store = makeStore(baseDoc, [])
    const result = store.get(selectionCornerRadiiAtom)
    expect(result.hasRects).toBe(false)
  })
})
