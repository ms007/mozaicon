import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { setStrokeWidthCommand } from './setStrokeWidth'

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
  corners: { radii: [0, 0, 0, 0], style: 'rounded', smoothing: 0 },
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

describe('setStrokeWidthCommand', () => {
  it('sets strokeWidth on a selected shape and pushes one undo entry', () => {
    const store = makeStore()

    store.set(setStrokeWidthCommand, 5)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.strokeWidth).toBe(5)

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Set stroke width')
  })

  it('is a no-op when setting the same strokeWidth value', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [{ ...baseRect, strokeWidth: 3 }],
    }
    const store = makeStore(doc)

    store.set(setStrokeWidthCommand, 3)

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('clamps negative values to 0', () => {
    const store = makeStore()

    store.set(setStrokeWidthCommand, -5)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.strokeWidth).toBe(0)
  })

  it('does not activate stroke on stroke-less shapes', () => {
    const store = makeStore()

    store.set(setStrokeWidthCommand, 4)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.strokeWidth).toBe(4)
    expect(shape.stroke).toBeUndefined()
  })

  it('applies to multiple selected shapes', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [
        { ...baseRect, id: 'r1', stroke: '#000', strokeWidth: 2 },
        { ...baseRect, id: 'r2', stroke: '#f00', strokeWidth: 1 },
      ],
    }
    const store = makeStore(doc, ['r1', 'r2'])

    store.set(setStrokeWidthCommand, 6)

    const shapes = store.get(activeIconAtom).shapes
    expect(shapes[0].strokeWidth).toBe(6)
    expect(shapes[1].strokeWidth).toBe(6)
  })

  it('does not push history when no shapes are selected', () => {
    const store = makeStore(baseDoc, [])

    store.set(setStrokeWidthCommand, 5)

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('is a no-op when clamped result equals current value', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [{ ...baseRect, strokeWidth: 0 }],
    }
    const store = makeStore(doc)

    store.set(setStrokeWidthCommand, -10)

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('allows setting strokeWidth to 0', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [{ ...baseRect, strokeWidth: 3 }],
    }
    const store = makeStore(doc)

    store.set(setStrokeWidthCommand, 0)

    expect(store.get(activeIconAtom).shapes[0].strokeWidth).toBe(0)
  })

  it('preserves stroke color when changing width', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [{ ...baseRect, stroke: '#ff0', strokeWidth: 2 }],
    }
    const store = makeStore(doc)

    store.set(setStrokeWidthCommand, 8)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#ff0')
    expect(shape.strokeWidth).toBe(8)
  })
})
