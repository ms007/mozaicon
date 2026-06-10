import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { draftShapeAtom } from '@/store/atoms/draft'
import { canRedoAtom, canUndoAtom, redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { makeIcon, makeRect } from '@/test/fixtures/shapes'
import { seedSelection } from '@/test/seedSelection'
import type { Icon, Shape } from '@/types/shapes'

import { createCommand } from './createCommand'

const shapeA = makeRect({ id: 'a', name: 'A' })
const shapeB = makeRect({ id: 'b', name: 'B', x: 10, y: 10 })

const emptyDoc = makeIcon()
const twoShapeDoc = makeIcon([shapeA, shapeB])

function makeStore(doc: Icon = emptyDoc) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  return store
}

describe('createCommand', () => {
  it('writes the next document and records a history entry on change', () => {
    const renameCommand = createCommand<string>('Rename', (doc, name) => ({
      icon: { ...doc, name },
    }))
    const store = makeStore()

    store.set(renameCommand, 'Next')

    expect(store.get(activeIconAtom).name).toBe('Next')
    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0]).toMatchObject({
      label: 'Rename',
      before: { icons: [expect.objectContaining({ name: 'Test' })] },
      after: { icons: [expect.objectContaining({ name: 'Next' })] },
    })
  })

  it('short-circuits when apply returns empty result (no-op on both axes)', () => {
    const noopCommand = createCommand<null>('Noop', () => ({}))
    const store = makeStore()
    const before = store.get(activeIconAtom)

    store.set(noopCommand, null)

    expect(store.get(activeIconAtom)).toBe(before)
    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('clears the redo stack on every dispatch', () => {
    const bumpCommand = createCommand<null>('Bump', (doc) => ({
      icon: { ...doc, name: `${doc.name}!` },
    }))
    const store = makeStore()
    const fakeProject = {
      id: 'proj-1',
      icons: [emptyDoc],
      activeIconId: emptyDoc.id,
      nextIconNumber: 2,
    }
    store.set(redoStackAtom, [
      {
        label: 'stale',
        before: fakeProject,
        after: fakeProject,
        selectionBefore: [],
        selectionAfter: [],
      },
    ])

    store.set(bumpCommand, null)

    expect(store.get(canRedoAtom)).toBe(false)
  })

  it('is a no-op during active gesture', () => {
    const renameCommand = createCommand<string>('Rename', (doc, name) => ({
      icon: { ...doc, name },
    }))
    const store = makeStore()
    store.set(draftShapeAtom, makeRect({ id: '__draft__', name: 'Draft' }))

    store.set(renameCommand, 'Next')

    expect(store.get(activeIconAtom).name).toBe('Test')
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

  it('handles combined commands (icon + selection)', () => {
    const addAndSelect = createCommand<Shape>('Add & Select', (doc, shape) => ({
      icon: { ...doc, shapes: [...doc.shapes, shape] },
      selection: [shape.id],
    }))
    const store = makeStore()

    store.set(addAndSelect, shapeA)

    expect(store.get(activeIconAtom).shapes).toHaveLength(1)
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
