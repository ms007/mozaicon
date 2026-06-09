import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { documentAtom } from '@/store/atoms/document'
import { undoStackAtom } from '@/store/atoms/history'
import type { Document, RectShape } from '@/types/shapes'

import { undoCommand } from './historyCommands'
import { renameShapeCommand } from './renameShape'

function makeRect(id: string, name = 'Rect'): RectShape {
  return {
    type: 'rect',
    id,
    name,
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    corners: DEFAULT_CORNERS,
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

describe('renameShapeCommand', () => {
  it('renames a shape and updates the document', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a', 'Old')] })

    store.set(renameShapeCommand, { id: 'a', name: 'New' })

    expect(store.get(documentAtom).shapes[0].name).toBe('New')
  })

  it('trims whitespace from the new name', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a', 'Old')] })

    store.set(renameShapeCommand, { id: 'a', name: '  Trimmed  ' })

    expect(store.get(documentAtom).shapes[0].name).toBe('Trimmed')
  })

  it('is a no-op when the name is unchanged — no history entry', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a', 'Same')] })

    store.set(renameShapeCommand, { id: 'a', name: 'Same' })

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('is a no-op when the trimmed name equals the current name', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a', 'Same')] })

    store.set(renameShapeCommand, { id: 'a', name: '  Same  ' })

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('is a no-op when the new name is empty — no history entry', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a', 'Keep')] })

    store.set(renameShapeCommand, { id: 'a', name: '' })

    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(store.get(documentAtom).shapes[0].name).toBe('Keep')
  })

  it('is a no-op when the new name is only whitespace', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a', 'Keep')] })

    store.set(renameShapeCommand, { id: 'a', name: '   ' })

    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(store.get(documentAtom).shapes[0].name).toBe('Keep')
  })

  it('pushes exactly one history entry', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a', 'Old')] })

    store.set(renameShapeCommand, { id: 'a', name: 'New' })

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Rename shape')
    expect(undo[0].before.shapes[0].name).toBe('Old')
    expect(undo[0].after.shapes[0].name).toBe('New')
  })

  it('undo restores the previous name', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a', 'Old')] })

    store.set(renameShapeCommand, { id: 'a', name: 'New' })
    store.set(undoCommand)

    expect(store.get(documentAtom).shapes[0].name).toBe('Old')
  })

  it('does not affect other shapes', () => {
    const store = makeStore({
      ...emptyDoc,
      shapes: [makeRect('a', 'A'), makeRect('b', 'B')],
    })

    store.set(renameShapeCommand, { id: 'a', name: 'A2' })

    expect(store.get(documentAtom).shapes[0].name).toBe('A2')
    expect(store.get(documentAtom).shapes[1].name).toBe('B')
  })

  it('is a no-op for a non-existent shape ID', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })

    store.set(renameShapeCommand, { id: 'nope', name: 'Whatever' })

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })
})
