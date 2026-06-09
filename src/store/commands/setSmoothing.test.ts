import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { documentAtom } from '@/store/atoms/document'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Corners, Document, RectShape } from '@/types/shapes'

import { setSmoothingCommand } from './setSmoothing'

const baseRect: RectShape = {
  id: 'r1',
  type: 'rect',
  name: 'Rect',
  visible: true,
  locked: false,
  x: 2,
  y: 2,
  width: 10,
  height: 8,
  corners: DEFAULT_CORNERS,
}

const docWithRect: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [baseRect],
}

function withSmoothing(smoothing: number): Corners {
  return { ...DEFAULT_CORNERS, smoothing }
}

function makeStore(doc: Document = docWithRect, selectedIds: string[] = ['r1']) {
  const store = createStore()
  store.set(documentAtom, doc)
  if (selectedIds.length > 0) {
    store.set(commitSelectionAtom, { ids: selectedIds, doc })
  }
  return store
}

describe('setSmoothingCommand', () => {
  it('sets smoothing on a selected rect and pushes one undo entry', () => {
    const store = makeStore()

    store.set(setSmoothingCommand, 60)

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.corners.smoothing).toBe(60)

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Set smoothing')
  })

  it('is a no-op when setting the same smoothing value', () => {
    const store = makeStore({
      ...docWithRect,
      shapes: [{ ...baseRect, corners: withSmoothing(50) }],
    })

    store.set(setSmoothingCommand, 50)

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('clamps smoothing above 100 to 100', () => {
    const store = makeStore()

    store.set(setSmoothingCommand, 150)

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.corners.smoothing).toBe(100)
  })

  it('clamps negative smoothing to 0', () => {
    const store = makeStore({
      ...docWithRect,
      shapes: [{ ...baseRect, corners: withSmoothing(50) }],
    })

    store.set(setSmoothingCommand, -10)

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.corners.smoothing).toBe(0)
  })

  it('applies to multiple selected rects', () => {
    const twoRectDoc: Document = {
      ...docWithRect,
      shapes: [baseRect, { ...baseRect, id: 'r2' }],
    }
    const store = makeStore(twoRectDoc, ['r1', 'r2'])

    store.set(setSmoothingCommand, 75)

    const shapes = store.get(documentAtom).shapes
    expect(shapes[0].corners.smoothing).toBe(75)
    expect(shapes[1].corners.smoothing).toBe(75)
  })

  it('does not push history when no rects are selected', () => {
    const store = makeStore(docWithRect, [])

    store.set(setSmoothingCommand, 50)

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('treats NaN as 0', () => {
    const store = makeStore({
      ...docWithRect,
      shapes: [{ ...baseRect, corners: withSmoothing(50) }],
    })

    store.set(setSmoothingCommand, NaN)

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.corners.smoothing).toBe(0)
  })

  it('treats Infinity as 0', () => {
    const store = makeStore()

    store.set(setSmoothingCommand, Infinity)

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.corners.smoothing).toBe(0)
  })

  it('is a no-op when clamped result equals current value', () => {
    const store = makeStore()

    store.set(setSmoothingCommand, -10)

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('preserves radii and style when changing smoothing', () => {
    const store = makeStore({
      ...docWithRect,
      shapes: [
        {
          ...baseRect,
          corners: { radii: [1, 2, 3, 4], style: 'smooth' as const, smoothing: 10 },
        },
      ],
    })

    store.set(setSmoothingCommand, 80)

    const { corners } = store.get(documentAtom).shapes[0]
    expect(corners.radii).toEqual([1, 2, 3, 4])
    expect(corners.style).toBe('smooth')
    expect(corners.smoothing).toBe(80)
  })

  it('undo restores the previous smoothing', () => {
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(setSmoothingCommand, 80)
    expect(store.get(documentAtom).shapes[0].corners.smoothing).toBe(80)

    const entry = store.get(undoStackAtom)[0]
    expect(entry.before).toBe(before)
  })
})
