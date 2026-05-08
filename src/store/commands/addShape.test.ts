import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import type { Document } from '@/types/shapes'

import { addShapeCommand } from './addShape'

const emptyDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [],
}

function makeStore(doc: Document = emptyDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

describe('addShapeCommand', () => {
  it('appends a RectShape to the document', () => {
    const store = makeStore()

    store.set(addShapeCommand, { x: 4, y: 4, width: 16, height: 16, fill: '#000' })

    const shapes = store.get(documentAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({
      type: 'rect',
      x: 4,
      y: 4,
      width: 16,
      height: 16,
      fill: '#000',
      name: 'Rect',
      visible: true,
      locked: false,
    })
    expect(shapes[0].id).toBeTypeOf('string')
    expect(shapes[0].id.length).toBeGreaterThan(0)
  })

  it('assigns a unique id to each dispatched shape', () => {
    const store = makeStore()

    store.set(addShapeCommand, { x: 0, y: 0, width: 1, height: 1 })
    store.set(addShapeCommand, { x: 0, y: 0, width: 1, height: 1 })

    const [a, b] = store.get(documentAtom).shapes
    expect(a.id).not.toBe(b.id)
  })

  it('pushes exactly one entry to the undo stack with the expected label', () => {
    const store = makeStore()

    store.set(addShapeCommand, { x: 4, y: 4, width: 16, height: 16, fill: '#000' })

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Add shape')
    expect(undo[0].before.shapes).toHaveLength(0)
    expect(undo[0].after.shapes).toHaveLength(1)
  })

  it('clears the redo stack on dispatch', () => {
    const store = makeStore()
    // simulate a prior redo-available state
    store.set(redoStackAtom, [{ label: 'stale', before: emptyDoc, after: emptyDoc }])

    store.set(addShapeCommand, { x: 0, y: 0, width: 1, height: 1 })

    expect(store.get(redoStackAtom)).toEqual([])
  })

  it('uses the explicit id when provided', () => {
    const store = makeStore()

    store.set(addShapeCommand, { id: 'my-id', x: 0, y: 0, width: 5, height: 5, fill: '#000' })

    const shapes = store.get(documentAtom).shapes
    expect(shapes[0].id).toBe('my-id')
  })

  it('does not mutate the prior document reference', () => {
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(addShapeCommand, { x: 0, y: 0, width: 1, height: 1 })

    const after = store.get(documentAtom)
    expect(after).not.toBe(before)
    expect(before.shapes).toHaveLength(0)
  })
})
