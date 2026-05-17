import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import { selectedIdsAtom } from '@/store/atoms/selection'
import type { Document } from '@/types/shapes'

import { addShapeCommand } from './addShape'
import { redoCommand, undoCommand } from './historyCommands'

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

    store.set(addShapeCommand, { type: 'rect', x: 4, y: 4, width: 16, height: 16, fill: '#000' })

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

    store.set(addShapeCommand, { type: 'rect', x: 0, y: 0, width: 1, height: 1 })
    store.set(addShapeCommand, { type: 'rect', x: 0, y: 0, width: 1, height: 1 })

    const [a, b] = store.get(documentAtom).shapes
    expect(a.id).not.toBe(b.id)
  })

  it('pushes exactly one entry to the undo stack with the expected label', () => {
    const store = makeStore()

    store.set(addShapeCommand, { type: 'rect', x: 4, y: 4, width: 16, height: 16, fill: '#000' })

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Add shape')
    expect(undo[0].before.shapes).toHaveLength(0)
    expect(undo[0].after.shapes).toHaveLength(1)
  })

  it('clears the redo stack on dispatch', () => {
    const store = makeStore()
    store.set(redoStackAtom, [
      {
        label: 'stale',
        before: emptyDoc,
        after: emptyDoc,
        selectionBefore: [],
        selectionAfter: [],
      },
    ])

    store.set(addShapeCommand, { type: 'rect', x: 0, y: 0, width: 1, height: 1 })

    expect(store.get(redoStackAtom)).toEqual([])
  })

  it('uses the explicit id when provided', () => {
    const store = makeStore()

    store.set(addShapeCommand, {
      type: 'rect',
      id: 'my-id',
      x: 0,
      y: 0,
      width: 5,
      height: 5,
      fill: '#000',
    })

    const shapes = store.get(documentAtom).shapes
    expect(shapes[0].id).toBe('my-id')
  })

  it('does not mutate the prior document reference', () => {
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(addShapeCommand, { type: 'rect', x: 0, y: 0, width: 1, height: 1 })

    const after = store.get(documentAtom)
    expect(after).not.toBe(before)
    expect(before.shapes).toHaveLength(0)
  })

  it('uses the type-keyed default name', () => {
    const store = makeStore()

    store.set(addShapeCommand, { type: 'rect', x: 0, y: 0, width: 1, height: 1 })

    expect(store.get(documentAtom).shapes[0].name).toBe('Rect')
  })

  it('allows overriding the default name', () => {
    const store = makeStore()

    store.set(addShapeCommand, {
      type: 'rect',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      name: 'My Custom Rect',
    })

    expect(store.get(documentAtom).shapes[0].name).toBe('My Custom Rect')
  })

  it('appends after existing shapes without replacing them', () => {
    const store = makeStore({
      ...emptyDoc,
      shapes: [
        {
          id: 'existing',
          type: 'rect',
          name: 'Old',
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          visible: true,
          locked: false,
        },
      ],
    })

    store.set(addShapeCommand, { type: 'rect', x: 1, y: 1, width: 2, height: 2 })

    const shapes = store.get(documentAtom).shapes
    expect(shapes).toHaveLength(2)
    expect(shapes[0].id).toBe('existing')
    expect(shapes[1].type).toBe('rect')
  })

  it('allows overriding visible and locked defaults', () => {
    const store = makeStore()

    store.set(addShapeCommand, {
      type: 'rect',
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      visible: false,
      locked: true,
    })

    const shape = store.get(documentAtom).shapes[0]
    expect(shape.visible).toBe(false)
    expect(shape.locked).toBe(true)
  })

  it('auto-selects the newly added shape', () => {
    const store = makeStore()

    store.set(addShapeCommand, { type: 'rect', id: 'new-rect', x: 0, y: 0, width: 5, height: 5 })

    expect(store.get(selectedIdsAtom)).toEqual(['new-rect'])
  })

  it('records selectionBefore/After in the history entry', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['old-id'])

    store.set(addShapeCommand, { type: 'rect', id: 'new-rect', x: 0, y: 0, width: 5, height: 5 })

    const entry = store.get(undoStackAtom)[0]
    expect(entry.selectionBefore).toEqual(['old-id'])
    expect(entry.selectionAfter).toEqual(['new-rect'])
  })

  it('undo rolls back both document and selection atomically', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['prev-sel'])

    store.set(addShapeCommand, { type: 'rect', id: 'added', x: 0, y: 0, width: 5, height: 5 })
    expect(store.get(documentAtom).shapes).toHaveLength(1)
    expect(store.get(selectedIdsAtom)).toEqual(['added'])

    store.set(undoCommand)

    expect(store.get(documentAtom).shapes).toHaveLength(0)
    expect(store.get(selectedIdsAtom)).toEqual(['prev-sel'])
  })

  it('redo re-appends the shape and re-selects it', () => {
    const store = makeStore()

    store.set(addShapeCommand, { type: 'rect', id: 'r1', x: 0, y: 0, width: 5, height: 5 })
    store.set(undoCommand)
    expect(store.get(documentAtom).shapes).toHaveLength(0)
    expect(store.get(selectedIdsAtom)).toEqual([])

    store.set(redoCommand)

    expect(store.get(documentAtom).shapes).toHaveLength(1)
    expect(store.get(documentAtom).shapes[0].id).toBe('r1')
    expect(store.get(selectedIdsAtom)).toEqual(['r1'])
  })
})
