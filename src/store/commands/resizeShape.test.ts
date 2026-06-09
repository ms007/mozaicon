import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { documentAtom } from '@/store/atoms/document'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import type { Document } from '@/types/shapes'

import { resizeShapeCommand } from './resizeShape'

const docWithRect: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [
    {
      id: 'r1',
      type: 'rect',
      name: 'Rect',
      visible: true,
      locked: false,
      x: 4,
      y: 4,
      width: 8,
      height: 6,
      fill: '#000',
      strokeWidth: 2,
      corners: DEFAULT_CORNERS,
    },
  ],
}

function makeStore(doc: Document = docWithRect) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

describe('resizeShapeCommand', () => {
  it('updates geometry and pushes exactly one HistoryEntry', () => {
    const store = makeStore()

    store.set(resizeShapeCommand, {
      r1: { x: 2, y: 2, width: 16, height: 12 },
    })

    const shape = store.get(documentAtom).shapes[0]
    expect(shape).toMatchObject({
      type: 'rect',
      x: 2,
      y: 2,
      width: 16,
      height: 12,
    })

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Resize shape')
  })

  it('preserves strokeWidth after resize', () => {
    const store = makeStore()

    store.set(resizeShapeCommand, {
      r1: { x: 0, y: 0, width: 20, height: 20 },
    })

    const shape = store.get(documentAtom).shapes[0]
    expect(shape).toMatchObject({ strokeWidth: 2, fill: '#000' })
  })

  it('does not push history when geometry is unchanged (identity no-op)', () => {
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(resizeShapeCommand, {
      r1: { x: 4, y: 4, width: 8, height: 6 },
    })

    expect(store.get(documentAtom)).toBe(before)
    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('does not push history for empty payload', () => {
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(resizeShapeCommand, {})

    expect(store.get(documentAtom)).toBe(before)
    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('does not push history when id is not found', () => {
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(resizeShapeCommand, {
      'nonexistent-id': { x: 0, y: 0, width: 10, height: 10 },
    })

    expect(store.get(documentAtom)).toBe(before)
    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('resizes multiple shapes in a single command', () => {
    const twoShapeDoc: Document = {
      ...docWithRect,
      shapes: [
        ...docWithRect.shapes,
        {
          id: 'r2',
          type: 'rect',
          name: 'Rect2',
          visible: true,
          locked: false,
          x: 10,
          y: 10,
          width: 4,
          height: 4,
          corners: DEFAULT_CORNERS,
        },
      ],
    }
    const store = makeStore(twoShapeDoc)

    store.set(resizeShapeCommand, {
      r1: { x: 2, y: 2, width: 16, height: 12 },
      r2: { x: 8, y: 8, width: 8, height: 8 },
    })

    const shapes = store.get(documentAtom).shapes
    expect(shapes[0]).toMatchObject({ id: 'r1', x: 2, y: 2, width: 16, height: 12 })
    expect(shapes[1]).toMatchObject({ id: 'r2', x: 8, y: 8, width: 8, height: 8 })
    expect(store.get(canUndoAtom)).toBe(true)
  })

  it('updates found shapes and ignores missing IDs in mixed payload', () => {
    const store = makeStore()

    store.set(resizeShapeCommand, {
      r1: { x: 0, y: 0, width: 20, height: 20 },
      'ghost-id': { x: 5, y: 5, width: 5, height: 5 },
    })

    const shapes = store.get(documentAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({ x: 0, y: 0, width: 20, height: 20 })
    expect(store.get(canUndoAtom)).toBe(true)
  })

  it('skips unchanged shapes in a multi-shape payload', () => {
    const twoShapeDoc: Document = {
      ...docWithRect,
      shapes: [
        ...docWithRect.shapes,
        {
          id: 'r2',
          type: 'rect',
          name: 'Rect2',
          visible: true,
          locked: false,
          x: 10,
          y: 10,
          width: 4,
          height: 4,
          corners: DEFAULT_CORNERS,
        },
      ],
    }
    const store = makeStore(twoShapeDoc)
    const before = store.get(documentAtom)

    store.set(resizeShapeCommand, {
      r1: { x: 4, y: 4, width: 8, height: 6 },
      r2: { x: 0, y: 0, width: 12, height: 12 },
    })

    const shapes = store.get(documentAtom).shapes
    expect(shapes[0]).toBe(before.shapes[0])
    expect(shapes[1]).not.toBe(before.shapes[1])
    expect(shapes[1]).toMatchObject({ x: 0, y: 0, width: 12, height: 12 })
  })
})
