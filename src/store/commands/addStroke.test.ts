import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { addStrokeCommand } from './addStroke'

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

const docWithRect: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [baseRect],
}

function makeStore(doc: Icon = docWithRect, selectedIds: string[] = ['r1']) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  if (selectedIds.length > 0) {
    store.set(commitSelectionAtom, { ids: selectedIds, doc })
  }
  return store
}

describe('addStrokeCommand', () => {
  it('adds stroke and strokeWidth to a stroke-less shape', () => {
    const store = makeStore()

    store.set(addStrokeCommand, undefined)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#000')
    expect(shape.strokeWidth).toBe(2)

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Add stroke')
  })

  it('uses the given color when provided', () => {
    const store = makeStore()

    store.set(addStrokeCommand, '#ff0000')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#ff0000')
    expect(shape.strokeWidth).toBe(2)
  })

  it('preserves existing strokeWidth when adding stroke', () => {
    const doc: Icon = {
      ...docWithRect,
      shapes: [{ ...baseRect, strokeWidth: 5 }],
    }
    const store = makeStore(doc)

    store.set(addStrokeCommand, undefined)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#000')
    expect(shape.strokeWidth).toBe(5)
  })

  it('is a no-op when all selected shapes already have a stroke', () => {
    const doc: Icon = {
      ...docWithRect,
      shapes: [{ ...baseRect, stroke: '#f00', strokeWidth: 3 }],
    }
    const store = makeStore(doc)

    store.set(addStrokeCommand, undefined)

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('applies only to shapes without a stroke in a multi-selection', () => {
    const doc: Icon = {
      ...docWithRect,
      shapes: [
        { ...baseRect, id: 'r1', stroke: '#f00', strokeWidth: 3 },
        { ...baseRect, id: 'r2' },
      ],
    }
    const store = makeStore(doc, ['r1', 'r2'])

    store.set(addStrokeCommand, undefined)

    const shapes = store.get(activeIconAtom).shapes
    expect(shapes[0].stroke).toBe('#f00')
    expect(shapes[0].strokeWidth).toBe(3)
    expect(shapes[1].stroke).toBe('#000')
    expect(shapes[1].strokeWidth).toBe(2)
  })

  it('treats stroke "none" as no stroke and adds one', () => {
    const doc: Icon = {
      ...docWithRect,
      shapes: [{ ...baseRect, stroke: 'none', strokeWidth: 4 }],
    }
    const store = makeStore(doc)

    store.set(addStrokeCommand, undefined)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#000')
    expect(shape.strokeWidth).toBe(4)
  })

  it('does not push history when nothing is selected', () => {
    const store = makeStore(docWithRect, [])

    store.set(addStrokeCommand, undefined)

    expect(store.get(canUndoAtom)).toBe(false)
  })
})
