import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { draftShapeAtom } from '@/store/atoms/draft'
import { canRedoAtom, canUndoAtom, redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import { seedSelection } from '@/test/seedSelection'
import type { Document, Shape } from '@/types/shapes'

import { createCommand } from './createCommand'

const shapeA = makeRect({ id: 'a', name: 'A' })
const shapeB = makeRect({ id: 'b', name: 'B', x: 10, y: 10 })

const emptyDoc = makeDoc()
const twoShapeDoc = makeDoc([shapeA, shapeB])

function makeStore(doc: Document = emptyDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

describe('createCommand', () => {
  it('writes the next document and records a history entry on change', () => {
    const renameCommand = createCommand<string>('Rename', (doc, name) => ({
      document: { ...doc, name },
    }))
    const store = makeStore()

    store.set(renameCommand, 'Next')

    expect(store.get(documentAtom).name).toBe('Next')
    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0]).toMatchObject({
      label: 'Rename',
      before: { name: 'Test' },
      after: { name: 'Next' },
    })
  })

  it('short-circuits when apply returns empty result (no-op on both axes)', () => {
    const noopCommand = createCommand<null>('Noop', () => ({}))
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(noopCommand, null)

    expect(store.get(documentAtom)).toBe(before)
    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('clears the redo stack on every dispatch', () => {
    const bumpCommand = createCommand<null>('Bump', (doc) => ({
      document: { ...doc, name: `${doc.name}!` },
    }))
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

    store.set(bumpCommand, null)

    expect(store.get(canRedoAtom)).toBe(false)
  })

  it('is a no-op during active gesture', () => {
    const renameCommand = createCommand<string>('Rename', (doc, name) => ({
      document: { ...doc, name },
    }))
    const store = makeStore()
    store.set(draftShapeAtom, makeRect({ id: '__draft__', name: 'Draft' }))

    store.set(renameCommand, 'Next')

    expect(store.get(documentAtom).name).toBe('Test')
    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('handles selection-only commands', () => {
    const selectCommand = createCommand<string[]>('Select', (_doc, ids) => ({
      selection: ids,
    }))
    const store = makeStore(twoShapeDoc)

    store.set(selectCommand, ['a'])

    expect(store.get(selectedIdsAtom)).toEqual(['a'])
    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].selectionBefore).toEqual([])
    expect(undo[0].selectionAfter).toEqual(['a'])
    expect(undo[0].before).toBe(undo[0].after)
  })

  it('handles combined commands (document + selection)', () => {
    const addAndSelect = createCommand<Shape>('Add & Select', (doc, shape) => ({
      document: { ...doc, shapes: [...doc.shapes, shape] },
      selection: [shape.id],
    }))
    const store = makeStore()

    store.set(addAndSelect, shapeA)

    expect(store.get(documentAtom).shapes).toHaveLength(1)
    expect(store.get(selectedIdsAtom)).toEqual(['a'])
    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].selectionBefore).toEqual([])
    expect(undo[0].selectionAfter).toEqual(['a'])
  })

  it('is a no-op when selection resolves to same value after normalization', () => {
    const selectCommand = createCommand<string[]>('Select', (_doc, ids) => ({
      selection: ids,
    }))
    const store = makeStore(twoShapeDoc)
    seedSelection(store, ['a'])

    store.set(selectCommand, ['a'])

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('normalizes selection: dedup, z-order sort, drop stale ids', () => {
    const selectCommand = createCommand<string[]>('Select', (_doc, ids) => ({
      selection: ids,
    }))
    const store = makeStore(twoShapeDoc)

    store.set(selectCommand, ['b', 'a', 'a', 'nonexistent'])

    expect(store.get(selectedIdsAtom)).toEqual(['a', 'b'])
  })
})
