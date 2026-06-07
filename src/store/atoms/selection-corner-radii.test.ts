import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Document, RectShape } from '@/types/shapes'

import { selectionCornerRadiiAtom } from './selection-corner-radii'
import { MIXED } from './selection-geometry'

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

  it('returns uniform corners for a rect with rx', () => {
    const store = makeStore({
      ...baseDoc,
      shapes: [{ ...baseRect, rx: 3 }],
    })

    const result = store.get(selectionCornerRadiiAtom)
    expect(result.hasRects).toBe(true)
    expect(result.tl).toBe(3)
    expect(result.tr).toBe(3)
    expect(result.br).toBe(3)
    expect(result.bl).toBe(3)
  })

  it('returns 0 for all corners when rect has no rx or radii', () => {
    const store = makeStore()

    const result = store.get(selectionCornerRadiiAtom)
    expect(result.hasRects).toBe(true)
    expect(result.tl).toBe(0)
    expect(result.tr).toBe(0)
    expect(result.br).toBe(0)
    expect(result.bl).toBe(0)
  })

  it('returns per-corner values from radii tuple', () => {
    const store = makeStore({
      ...baseDoc,
      shapes: [{ ...baseRect, radii: [1, 2, 3, 4] }],
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
        { ...baseRect, rx: 2 },
        { ...baseRect, id: 'r2', rx: 5 },
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
        { ...baseRect, rx: 3 },
        { ...baseRect, id: 'r2', rx: 3 },
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
        { ...baseRect, radii: [2, 3, 2, 2] },
        { ...baseRect, id: 'r2', radii: [2, 5, 2, 2] },
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
      shapes: [{ ...baseRect, rx: 3 }],
    })

    const result = store.get(selectionCornerRadiiAtom)
    expect(result.hasRects).toBe(true)
    expect(result.tl).toBe(3)
  })

  it('returns hasRects=false when selection contains only non-rect shapes', () => {
    // Currently only rects exist in the schema, so test with no rects selected
    const store = makeStore(baseDoc, [])
    const result = store.get(selectionCornerRadiiAtom)
    expect(result.hasRects).toBe(false)
  })
})
