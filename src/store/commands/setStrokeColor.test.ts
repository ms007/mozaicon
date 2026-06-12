import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { setStrokeColorCommand } from './setStrokeColor'

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

describe('setStrokeColorCommand', () => {
  it('sets stroke color on a selected shape and pushes one undo entry', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [{ ...baseRect, stroke: '#000', strokeWidth: 2 }],
    }
    const store = makeStore(doc)

    store.set(setStrokeColorCommand, '#ff0000')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#ff0000')
    expect(shape.strokeWidth).toBe(2)

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Set stroke color')
  })

  it('activates stroke on stroke-less shapes', () => {
    const store = makeStore()

    store.set(setStrokeColorCommand, '#ff0000')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#ff0000')
    expect(shape.strokeWidth).toBe(2)
  })

  it('activates stroke on shapes with stroke "none"', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [{ ...baseRect, stroke: 'none', strokeWidth: 4 }],
    }
    const store = makeStore(doc)

    store.set(setStrokeColorCommand, '#00ff00')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#00ff00')
    expect(shape.strokeWidth).toBe(4)
  })

  it('is a no-op when all selected shapes already have the same color', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [{ ...baseRect, stroke: '#ff0000', strokeWidth: 2 }],
    }
    const store = makeStore(doc)

    store.set(setStrokeColorCommand, '#ff0000')

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('applies to multiple selected shapes', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [
        { ...baseRect, id: 'r1', stroke: '#000', strokeWidth: 2 },
        { ...baseRect, id: 'r2', stroke: '#fff', strokeWidth: 3 },
      ],
    }
    const store = makeStore(doc, ['r1', 'r2'])

    store.set(setStrokeColorCommand, '#0000ff')

    const shapes = store.get(activeIconAtom).shapes
    expect(shapes[0].stroke).toBe('#0000ff')
    expect(shapes[1].stroke).toBe('#0000ff')
  })

  it('does not push history when no shapes are selected', () => {
    const store = makeStore(baseDoc, [])

    store.set(setStrokeColorCommand, '#ff0000')

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('preserves existing strokeWidth when activating stroke', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [{ ...baseRect, strokeWidth: 5 }],
    }
    const store = makeStore(doc)

    store.set(setStrokeColorCommand, '#ff0000')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#ff0000')
    expect(shape.strokeWidth).toBe(5)
  })
})
