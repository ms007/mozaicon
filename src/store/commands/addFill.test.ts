import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { addFillCommand } from './addFill'

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
  shapes: [{ ...baseRect, fill: 'none' }],
}

function makeStore(doc: Icon = docWithRect, selectedIds: string[] = ['r1']) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  if (selectedIds.length > 0) {
    store.set(commitSelectionAtom, { ids: selectedIds, doc })
  }
  return store
}

describe('addFillCommand', () => {
  it('adds fill to a fill-less shape using default gray', () => {
    const store = makeStore()

    store.set(addFillCommand, undefined)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('#cccccc')

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Add fill')
  })

  it('uses the given color when provided', () => {
    const store = makeStore()

    store.set(addFillCommand, '#ff0000')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('#ff0000')
  })

  it('is a no-op when all selected shapes already have a fill', () => {
    const doc: Icon = {
      ...docWithRect,
      shapes: [{ ...baseRect, fill: '#f00' }],
    }
    const store = makeStore(doc)

    store.set(addFillCommand, undefined)

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('applies only to shapes without a fill in a multi-selection', () => {
    const doc: Icon = {
      ...docWithRect,
      shapes: [
        { ...baseRect, id: 'r1', fill: '#f00' },
        { ...baseRect, id: 'r2', fill: 'none' },
      ],
    }
    const store = makeStore(doc, ['r1', 'r2'])

    store.set(addFillCommand, undefined)

    const shapes = store.get(activeIconAtom).shapes
    expect(shapes[0].fill).toBe('#f00')
    expect(shapes[1].fill).toBe('#cccccc')
  })

  it('treats fill "none" as no fill and adds one', () => {
    const store = makeStore()

    store.set(addFillCommand, undefined)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('#cccccc')
  })

  it('treats undefined fill as no fill and adds one', () => {
    const doc: Icon = {
      ...docWithRect,
      shapes: [baseRect],
    }
    const store = makeStore(doc)

    store.set(addFillCommand, '#abc')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('#abc')
  })

  it('does not push history when nothing is selected', () => {
    const store = makeStore(docWithRect, [])

    store.set(addFillCommand, undefined)

    expect(store.get(canUndoAtom)).toBe(false)
  })
})
