import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { removeFillCommand } from './removeFill'

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

const docWithFill: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [{ ...baseRect, fill: '#cccccc' }],
}

function makeStore(doc: Icon = docWithFill, selectedIds: string[] = ['r1']) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  if (selectedIds.length > 0) {
    store.set(commitSelectionAtom, { ids: selectedIds, doc })
  }
  return store
}

describe('removeFillCommand', () => {
  it('writes explicit "none" and pushes one undo entry', () => {
    const store = makeStore()

    store.set(removeFillCommand, undefined)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('none')

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Remove fill')
  })

  it('is a no-op when fill is already "none"', () => {
    const doc: Icon = {
      ...docWithFill,
      shapes: [{ ...baseRect, fill: 'none' }],
    }
    const store = makeStore(doc)

    store.set(removeFillCommand, undefined)

    expect(store.get(canUndoAtom)).toBe(false)
    expect(store.get(activeIconAtom).shapes[0].fill).toBe('none')
  })

  it('is a no-op when fill is undefined', () => {
    const doc: Icon = {
      ...docWithFill,
      shapes: [baseRect],
    }
    const store = makeStore(doc)

    store.set(removeFillCommand, undefined)

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('removes fill from all selected shapes in multi-selection', () => {
    const doc: Icon = {
      ...docWithFill,
      shapes: [
        { ...baseRect, id: 'r1', fill: '#f00' },
        { ...baseRect, id: 'r2', fill: '#0f0' },
      ],
    }
    const store = makeStore(doc, ['r1', 'r2'])

    store.set(removeFillCommand, undefined)

    const shapes = store.get(activeIconAtom).shapes
    expect(shapes[0].fill).toBe('none')
    expect(shapes[1].fill).toBe('none')
  })

  it('does not push history when nothing is selected', () => {
    const store = makeStore(docWithFill, [])

    store.set(removeFillCommand, undefined)

    expect(store.get(canUndoAtom)).toBe(false)
  })
})
