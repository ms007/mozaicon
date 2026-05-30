import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom, shapeAtom } from '@/store/atoms/document'
import { redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import { restoreSelectionAtom, selectedIdsAtom } from '@/store/atoms/selection'
import type { Document, RectShape } from '@/types/shapes'

import { deleteShapesCommand } from './deleteShapes'
import { redoCommand, undoCommand } from './historyCommands'

function makeRect(id: string): RectShape {
  return {
    type: 'rect',
    id,
    name: 'Rect',
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    width: 10,
    height: 10,
  }
}

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

describe('deleteShapesCommand', () => {
  it('removes a single selected shape from the document', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })
    store.set(restoreSelectionAtom, ['a'])

    store.set(deleteShapesCommand, { ids: ['a'] })

    expect(store.get(documentAtom).shapes).toHaveLength(0)
  })

  it('clears selection after deletion', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })
    store.set(restoreSelectionAtom, ['a'])

    store.set(deleteShapesCommand, { ids: ['a'] })

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('removes multiple selected shapes in one step', () => {
    const store = makeStore({
      ...emptyDoc,
      shapes: [makeRect('a'), makeRect('b'), makeRect('c')],
    })
    store.set(restoreSelectionAtom, ['a', 'b', 'c'])

    store.set(deleteShapesCommand, { ids: ['a', 'b', 'c'] })

    expect(store.get(documentAtom).shapes).toHaveLength(0)
    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('deleting a subset leaves remaining shapes intact and selected', () => {
    const store = makeStore({
      ...emptyDoc,
      shapes: [makeRect('a'), makeRect('b'), makeRect('c')],
    })
    store.set(restoreSelectionAtom, ['a', 'b', 'c'])

    store.set(deleteShapesCommand, { ids: ['a', 'c'] })

    const shapes = store.get(documentAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0].id).toBe('b')
    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('pushes exactly one history entry with correct label and snapshots', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })
    store.set(restoreSelectionAtom, ['a'])

    store.set(deleteShapesCommand, { ids: ['a'] })

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Delete shapes')
    expect(undo[0].before.shapes).toHaveLength(1)
    expect(undo[0].after.shapes).toHaveLength(0)
    expect(undo[0].selectionBefore).toEqual(['a'])
    expect(undo[0].selectionAfter).toEqual([])
  })

  it('undo restores both deleted shapes and prior selection atomically', () => {
    const store = makeStore({
      ...emptyDoc,
      shapes: [makeRect('a'), makeRect('b')],
    })
    store.set(restoreSelectionAtom, ['a', 'b'])

    store.set(deleteShapesCommand, { ids: ['a', 'b'] })
    expect(store.get(documentAtom).shapes).toHaveLength(0)
    expect(store.get(selectedIdsAtom)).toEqual([])

    store.set(undoCommand)

    expect(store.get(documentAtom).shapes).toHaveLength(2)
    expect(store.get(selectedIdsAtom)).toEqual(['a', 'b'])
  })

  it('redo re-deletes shapes after undo', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })
    store.set(restoreSelectionAtom, ['a'])

    store.set(deleteShapesCommand, { ids: ['a'] })
    store.set(undoCommand)
    expect(store.get(documentAtom).shapes).toHaveLength(1)

    store.set(redoCommand)

    expect(store.get(documentAtom).shapes).toHaveLength(0)
    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('is a no-op when the ID list is empty — no history entry pushed', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })
    store.set(restoreSelectionAtom, ['a'])

    store.set(deleteShapesCommand, { ids: [] })

    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(store.get(documentAtom).shapes).toHaveLength(1)
    expect(store.get(selectedIdsAtom)).toEqual(['a'])
  })

  it('is a no-op when IDs match no existing shapes — no history entry pushed', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })
    store.set(restoreSelectionAtom, ['a'])

    store.set(deleteShapesCommand, { ids: ['nonexistent'] })

    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(store.get(documentAtom).shapes).toHaveLength(1)
    expect(store.get(selectedIdsAtom)).toEqual(['a'])
  })

  it('evicts atomFamily entries for deleted shape IDs', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })

    expect(store.get(shapeAtom('a'))).toBeDefined()

    store.set(deleteShapesCommand, { ids: ['a'] })

    expect(store.get(shapeAtom('a'))).toBeUndefined()
  })

  it('clears the redo stack on dispatch', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })
    store.set(redoStackAtom, [
      {
        label: 'stale',
        before: emptyDoc,
        after: emptyDoc,
        selectionBefore: [],
        selectionAfter: [],
      },
    ])

    store.set(deleteShapesCommand, { ids: ['a'] })

    expect(store.get(redoStackAtom)).toHaveLength(0)
  })
})
