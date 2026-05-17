import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { activeDragAtom } from '@/store/atoms/draft'
import { canRedoAtom, canUndoAtom, redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import { selectedIdsAtom } from '@/store/atoms/selection'
import type { Document } from '@/types/shapes'

import { createCommand } from './createCommand'
import { redoCommand, undoCommand } from './historyCommands'

const emptyDoc: Document = {
  id: 'doc-test',
  name: 'A',
  viewBox: [0, 0, 24, 24],
  shapes: [],
}

const renameCommand = createCommand<string>('Rename', (doc, name) => ({
  document: { ...doc, name },
}))

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

  it('restores selection on undo', () => {
    const selectCommand = createCommand<string[]>('Select', (_doc, ids) => ({
      selection: ids,
    }))
    const store = makeStore()
    store.set(documentAtom, {
      ...emptyDoc,
      shapes: [
        {
          id: 's1',
          name: 'S1',
          visible: true,
          locked: false,
          type: 'rect',
          x: 0,
          y: 0,
          width: 5,
          height: 5,
        },
      ],
    })
    store.set(selectCommand, ['s1'])

    store.set(undoCommand)

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('is a no-op during active gesture', () => {
    const store = makeStore()
    store.set(renameCommand, 'B')
    store.set(activeDragAtom, {
      toolId: 'test',
      pointerId: 1,
      startViewBox: { x: 0, y: 0 },
      startScreen: { x: 0, y: 0 },
    })

    store.set(undoCommand)

    expect(store.get(documentAtom).name).toBe('B')
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

  it('restores selection on redo', () => {
    const selectCommand = createCommand<string[]>('Select', (_doc, ids) => ({
      selection: ids,
    }))
    const store = makeStore()
    store.set(documentAtom, {
      ...emptyDoc,
      shapes: [
        {
          id: 's1',
          name: 'S1',
          visible: true,
          locked: false,
          type: 'rect',
          x: 0,
          y: 0,
          width: 5,
          height: 5,
        },
      ],
    })
    store.set(selectCommand, ['s1'])
    store.set(undoCommand)

    store.set(redoCommand)

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
  })

  it('is a no-op during active gesture', () => {
    const store = makeStore()
    store.set(renameCommand, 'B')
    store.set(undoCommand)
    store.set(activeDragAtom, {
      toolId: 'test',
      pointerId: 1,
      startViewBox: { x: 0, y: 0 },
      startScreen: { x: 0, y: 0 },
    })

    store.set(redoCommand)

    expect(store.get(documentAtom).name).toBe('A')
  })
})

describe('canUndoAtom / canRedoAtom', () => {
  it('canUndoAtom is false when stack is empty', () => {
    const store = makeStore()
    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('canUndoAtom is true when stack is non-empty', () => {
    const store = makeStore()
    store.set(renameCommand, 'B')
    expect(store.get(canUndoAtom)).toBe(true)
  })

  it('canUndoAtom is false during active gesture even with stack', () => {
    const store = makeStore()
    store.set(renameCommand, 'B')
    store.set(activeDragAtom, {
      toolId: 'test',
      pointerId: 1,
      startViewBox: { x: 0, y: 0 },
      startScreen: { x: 0, y: 0 },
    })
    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('canRedoAtom is false during active gesture even with stack', () => {
    const store = makeStore()
    store.set(renameCommand, 'B')
    store.set(undoCommand)
    store.set(activeDragAtom, {
      toolId: 'test',
      pointerId: 1,
      startViewBox: { x: 0, y: 0 },
      startScreen: { x: 0, y: 0 },
    })
    expect(store.get(canRedoAtom)).toBe(false)
  })
})
