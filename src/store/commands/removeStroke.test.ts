import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { removeStrokeCommand } from './removeStroke'

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

const docWithStroke: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [{ ...baseRect, stroke: '#000', strokeWidth: 2 }],
}

function makeStore(doc: Icon = docWithStroke, selectedIds: string[] = ['r1']) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  if (selectedIds.length > 0) {
    store.set(commitSelectionAtom, { ids: selectedIds, doc })
  }
  return store
}

describe('removeStrokeCommand', () => {
  it('removes stroke from a selected shape and pushes one undo entry', () => {
    const store = makeStore()

    store.set(removeStrokeCommand, undefined)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBeUndefined()
    expect(shape.strokeWidth).toBe(2)

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Remove stroke')
  })

  it('preserves strokeWidth after removing stroke', () => {
    const doc: Icon = {
      ...docWithStroke,
      shapes: [{ ...baseRect, stroke: '#f00', strokeWidth: 5 }],
    }
    const store = makeStore(doc)

    store.set(removeStrokeCommand, undefined)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBeUndefined()
    expect(shape.strokeWidth).toBe(5)
  })

  it('is a no-op when no selected shapes have a stroke', () => {
    const doc: Icon = {
      id: 'doc-test',
      name: 'Test',
      viewBox: [0, 0, 24, 24],
      shapes: [baseRect],
    }
    const store = makeStore(doc)

    store.set(removeStrokeCommand, undefined)

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('removes stroke from all selected shapes in multi-selection', () => {
    const doc: Icon = {
      ...docWithStroke,
      shapes: [
        { ...baseRect, id: 'r1', stroke: '#f00', strokeWidth: 3 },
        { ...baseRect, id: 'r2', stroke: '#0f0', strokeWidth: 4 },
      ],
    }
    const store = makeStore(doc, ['r1', 'r2'])

    store.set(removeStrokeCommand, undefined)

    const shapes = store.get(activeIconAtom).shapes
    expect(shapes[0].stroke).toBeUndefined()
    expect(shapes[0].strokeWidth).toBe(3)
    expect(shapes[1].stroke).toBeUndefined()
    expect(shapes[1].strokeWidth).toBe(4)
  })

  it('is a no-op when stroke is "none"', () => {
    const doc: Icon = {
      ...docWithStroke,
      shapes: [{ ...baseRect, stroke: 'none', strokeWidth: 2 }],
    }
    const store = makeStore(doc)

    store.set(removeStrokeCommand, undefined)

    expect(store.get(canUndoAtom)).toBe(false)
    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('none')
  })

  it('does not push history when nothing is selected', () => {
    const store = makeStore(docWithStroke, [])

    store.set(removeStrokeCommand, undefined)

    expect(store.get(canUndoAtom)).toBe(false)
  })
})
