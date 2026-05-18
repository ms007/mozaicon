import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import type { Document } from '@/types/shapes'

import { redoCommand, undoCommand } from './historyCommands'
import {
  clearSelectionCommand,
  selectShapesCommand,
  toggleSelectionCommand,
} from './selectionCommands'

const testDoc = makeDoc([
  makeRect({ id: 'a', name: 'A', width: 5, height: 5 }),
  makeRect({ id: 'b', name: 'B', x: 5, y: 5, width: 5, height: 5 }),
  makeRect({ id: 'c', name: 'C', x: 10, y: 10, width: 5, height: 5 }),
])

function makeStore(doc: Document = testDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

describe('selectShapesCommand', () => {
  it('sets selection to given ids', () => {
    const store = makeStore()

    store.set(selectShapesCommand, ['a', 'b'])

    expect(store.get(selectedIdsAtom)).toEqual(['a', 'b'])
  })

  it('pushes a history entry with correct label', () => {
    const store = makeStore()

    store.set(selectShapesCommand, ['a'])

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Select shapes')
  })

  it('is a no-op when selecting already-selected ids', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a'])

    store.set(selectShapesCommand, ['a'])

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('normalizes selection (dedup, z-order, drop stale)', () => {
    const store = makeStore()

    store.set(selectShapesCommand, ['c', 'a', 'a', 'gone'])

    expect(store.get(selectedIdsAtom)).toEqual(['a', 'c'])
  })

  it('does not change the document', () => {
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(selectShapesCommand, ['a'])

    expect(store.get(documentAtom)).toBe(before)
    const undo = store.get(undoStackAtom)
    expect(undo[0].before).toBe(undo[0].after)
  })

  it('all-stale ids clears selection when non-empty', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a'])

    store.set(selectShapesCommand, ['gone1', 'gone2'])

    expect(store.get(selectedIdsAtom)).toEqual([])
    expect(store.get(canUndoAtom)).toBe(true)
  })

  it('all-stale ids is no-op when selection already empty', () => {
    const store = makeStore()

    store.set(selectShapesCommand, ['gone1', 'gone2'])

    expect(store.get(canUndoAtom)).toBe(false)
  })
})

describe('toggleSelectionCommand', () => {
  it('adds id to selection when not present', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a'])

    store.set(toggleSelectionCommand, 'b')

    expect(store.get(selectedIdsAtom)).toEqual(['a', 'b'])
  })

  it('removes id from selection when already present', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a', 'b'])

    store.set(toggleSelectionCommand, 'a')

    expect(store.get(selectedIdsAtom)).toEqual(['b'])
  })

  it('pushes a history entry with correct label', () => {
    const store = makeStore()

    store.set(toggleSelectionCommand, 'a')

    expect(store.get(undoStackAtom)[0].label).toBe('Toggle selection')
  })

  it('toggle add then undo restores prior selection', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a'])

    store.set(toggleSelectionCommand, 'b')
    expect(store.get(selectedIdsAtom)).toEqual(['a', 'b'])

    store.set(undoCommand)
    expect(store.get(selectedIdsAtom)).toEqual(['a'])
  })

  it('is a no-op when toggling a stale id not in the document', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a'])

    store.set(toggleSelectionCommand, 'nonexistent')

    expect(store.get(selectedIdsAtom)).toEqual(['a'])
    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('removing the last selected item yields empty selection', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a'])

    store.set(toggleSelectionCommand, 'a')

    expect(store.get(selectedIdsAtom)).toEqual([])
    expect(store.get(canUndoAtom)).toBe(true)
  })
})

describe('clearSelectionCommand', () => {
  it('empties the selection', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a', 'b'])

    store.set(clearSelectionCommand, undefined)

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('pushes a history entry with correct label', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a'])

    store.set(clearSelectionCommand, undefined)

    expect(store.get(undoStackAtom)[0].label).toBe('Clear selection')
  })

  it('is a no-op when selection is already empty', () => {
    const store = makeStore()

    store.set(clearSelectionCommand, undefined)

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('undo restores previous selection', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a', 'b'])

    store.set(clearSelectionCommand, undefined)
    store.set(undoCommand)

    expect(store.get(selectedIdsAtom)).toEqual(['a', 'b'])
  })

  it('redo after undo re-clears the selection', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a', 'b'])

    store.set(clearSelectionCommand, undefined)
    store.set(undoCommand)
    expect(store.get(selectedIdsAtom)).toEqual(['a', 'b'])

    store.set(redoCommand)
    expect(store.get(selectedIdsAtom)).toEqual([])
  })
})
