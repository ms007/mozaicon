import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { setFillColorCommand } from './setFillColor'

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
  shapes: [{ ...baseRect, fill: '#cccccc' }],
}

function makeStore(doc: Icon = baseDoc, selectedIds: string[] = ['r1']) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  if (selectedIds.length > 0) {
    store.set(commitSelectionAtom, { ids: selectedIds, doc })
  }
  return store
}

describe('setFillColorCommand', () => {
  it('sets fill color on a selected shape and pushes one undo entry', () => {
    const store = makeStore()

    store.set(setFillColorCommand, '#ff0000')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('#ff0000')

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Set fill color')
  })

  it('writes fill on a shape with fill "none"', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [{ ...baseRect, fill: 'none' }],
    }
    const store = makeStore(doc)

    store.set(setFillColorCommand, '#00ff00')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('#00ff00')
  })

  it('writes fill on a shape with undefined fill', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [baseRect],
    }
    const store = makeStore(doc)

    store.set(setFillColorCommand, '#00ff00')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('#00ff00')
  })

  it('is a no-op when all selected shapes already have the same color', () => {
    const store = makeStore()

    store.set(setFillColorCommand, '#cccccc')

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('applies to multiple selected shapes', () => {
    const doc: Icon = {
      ...baseDoc,
      shapes: [
        { ...baseRect, id: 'r1', fill: '#000' },
        { ...baseRect, id: 'r2', fill: '#fff' },
      ],
    }
    const store = makeStore(doc, ['r1', 'r2'])

    store.set(setFillColorCommand, '#0000ff')

    const shapes = store.get(activeIconAtom).shapes
    expect(shapes[0].fill).toBe('#0000ff')
    expect(shapes[1].fill).toBe('#0000ff')
  })

  it('does not push history when no shapes are selected', () => {
    const store = makeStore(baseDoc, [])

    store.set(setFillColorCommand, '#ff0000')

    expect(store.get(canUndoAtom)).toBe(false)
  })
})
