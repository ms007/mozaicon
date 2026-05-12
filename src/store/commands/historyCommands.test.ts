import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import type { Document } from '@/types/shapes'

import { createCommand } from './createCommand'
import { redoCommand, undoCommand } from './historyCommands'

const emptyDoc: Document = {
  id: 'doc-test',
  name: 'A',
  viewBox: [0, 0, 24, 24],
  shapes: [],
}

const renameCommand = createCommand<string>('Rename', (doc, name) => ({ ...doc, name }))

function makeStore() {
  const store = createStore()
  store.set(documentAtom, emptyDoc)
  return store
}

describe('undoCommand', () => {
  it('restores the previous document and moves the entry onto the redo stack', () => {
    const store = makeStore()
    store.set(renameCommand, 'B')

    store.set(undoCommand)

    expect(store.get(documentAtom).name).toBe('A')
    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(store.get(redoStackAtom)).toHaveLength(1)
    expect(store.get(redoStackAtom)[0].label).toBe('Rename')
  })

  it('is a no-op when the undo stack is empty', () => {
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(undoCommand)

    expect(store.get(documentAtom)).toBe(before)
    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(store.get(redoStackAtom)).toHaveLength(0)
  })

  it('peels entries one at a time', () => {
    const store = makeStore()
    store.set(renameCommand, 'B')
    store.set(renameCommand, 'C')

    store.set(undoCommand)
    expect(store.get(documentAtom).name).toBe('B')

    store.set(undoCommand)
    expect(store.get(documentAtom).name).toBe('A')
  })
})

describe('redoCommand', () => {
  it('reapplies the next entry and moves it back onto the undo stack', () => {
    const store = makeStore()
    store.set(renameCommand, 'B')
    store.set(undoCommand)

    store.set(redoCommand)

    expect(store.get(documentAtom).name).toBe('B')
    expect(store.get(undoStackAtom)).toHaveLength(1)
    expect(store.get(redoStackAtom)).toHaveLength(0)
  })

  it('is a no-op when the redo stack is empty', () => {
    const store = makeStore()
    store.set(renameCommand, 'B')
    const before = store.get(documentAtom)

    store.set(redoCommand)

    expect(store.get(documentAtom)).toBe(before)
    expect(store.get(redoStackAtom)).toHaveLength(0)
  })
})
