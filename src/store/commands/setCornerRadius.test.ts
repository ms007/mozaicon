import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { documentAtom } from '@/store/atoms/document'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Corners, Document, RectShape } from '@/types/shapes'

import { setCornerRadiusCommand } from './setCornerRadius'

function corners(radii: [number, number, number, number]): Corners {
  return { ...DEFAULT_CORNERS, radii }
}

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

function makeStore(doc: Document = docWithRect, selectedIds: string[] = ['r1']) {
  const store = createStore()
  store.set(documentAtom, doc)
  if (selectedIds.length > 0) {
    store.set(commitSelectionAtom, { ids: selectedIds, doc })
  }
  return store
}

describe('setCornerRadiusCommand', () => {
  it('sets uniform radius on a selected rect and pushes one undo entry', () => {
    const store = makeStore()

    store.set(setCornerRadiusCommand, { radius: 3 })

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.corners.radii).toEqual([3, 3, 3, 3])

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Set corner radius')
  })

  it('undo restores the previous corners', () => {
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(setCornerRadiusCommand, { radius: 3 })
    expect(store.get(documentAtom).shapes[0].corners.radii).toEqual([3, 3, 3, 3])

    const entry = store.get(undoStackAtom)[0]
    expect(entry.before).toBe(before)
  })

  it('sets a single corner and stores per-corner radii', () => {
    const store = makeStore({
      ...docWithRect,
      shapes: [{ ...baseRect, corners: corners([2, 2, 2, 2]) }],
    })

    store.set(setCornerRadiusCommand, { corner: 0, radius: 4 })

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.corners.radii).toEqual([4, 2, 2, 2])
  })

  it('normalizes per-corner back to uniform when all corners equal', () => {
    const store = makeStore({
      ...docWithRect,
      shapes: [{ ...baseRect, corners: corners([2, 3, 2, 2]) }],
    })

    store.set(setCornerRadiusCommand, { corner: 1, radius: 2 })

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.corners.radii).toEqual([2, 2, 2, 2])
  })

  it('clamps radius to half the smaller side', () => {
    const store = makeStore()

    store.set(setCornerRadiusCommand, { radius: 100 })

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.corners.radii).toEqual([4, 4, 4, 4])
  })

  it('is a no-op when setting the same uniform radius', () => {
    const store = makeStore({
      ...docWithRect,
      shapes: [{ ...baseRect, corners: corners([3, 3, 3, 3]) }],
    })

    store.set(setCornerRadiusCommand, { radius: 3 })

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('is a no-op when setting the same single corner', () => {
    const store = makeStore({
      ...docWithRect,
      shapes: [{ ...baseRect, corners: corners([4, 2, 2, 2]) }],
    })

    store.set(setCornerRadiusCommand, { corner: 0, radius: 4 })

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('ignores non-rect shapes in the selection', () => {
    const store = makeStore()

    store.set(setCornerRadiusCommand, { radius: 3 })

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.corners.radii).toEqual([3, 3, 3, 3])
  })

  it('applies to multiple selected rects', () => {
    const twoRectDoc: Document = {
      ...docWithRect,
      shapes: [baseRect, { ...baseRect, id: 'r2', width: 6, height: 4 }],
    }
    const store = makeStore(twoRectDoc, ['r1', 'r2'])

    store.set(setCornerRadiusCommand, { radius: 5 })

    const shapes = store.get(documentAtom).shapes
    expect(shapes[0].corners.radii).toEqual([4, 4, 4, 4])
    expect(shapes[1].corners.radii).toEqual([2, 2, 2, 2])
  })

  it('does not push history when no rects are selected', () => {
    const store = makeStore(docWithRect, [])

    store.set(setCornerRadiusCommand, { radius: 3 })

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('clamps negative radius to zero', () => {
    const store = makeStore({
      ...docWithRect,
      shapes: [{ ...baseRect, corners: corners([3, 3, 3, 3]) }],
    })

    store.set(setCornerRadiusCommand, { radius: -5 })

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.corners.radii).toEqual([0, 0, 0, 0])
  })

  it('setting uniform radius 0 sets all radii to zero', () => {
    const store = makeStore({
      ...docWithRect,
      shapes: [{ ...baseRect, corners: corners([3, 3, 3, 3]) }],
    })

    store.set(setCornerRadiusCommand, { radius: 0 })

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.corners.radii).toEqual([0, 0, 0, 0])
  })
})
