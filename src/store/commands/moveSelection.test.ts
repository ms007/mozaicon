import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { undoStackAtom } from '@/store/atoms/history'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import type { Document } from '@/types/shapes'

import { undoCommand } from './historyCommands'
import { moveSelectionCommand } from './moveSelection'

const testDoc = makeDoc([
  makeRect({ id: 'a', name: 'A', x: 0, y: 0, width: 5, height: 5 }),
  makeRect({ id: 'b', name: 'B', x: 10, y: 10, width: 5, height: 5 }),
  makeRect({ id: 'c', name: 'C', x: 20, y: 20, width: 5, height: 5 }),
])

function makeStore(doc: Document = testDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

describe('moveSelectionCommand', () => {
  it('translates a rect by dx, dy', () => {
    const store = makeStore()

    store.set(moveSelectionCommand, { ids: ['a'], dx: 5, dy: 3 })

    const doc = store.get(documentAtom)
    const shape = doc.shapes.find((s) => s.id === 'a')
    expect(shape).toBeDefined()
    expect(shape?.x).toBe(5)
    expect(shape?.y).toBe(3)
  })

  it('translates multiple shapes', () => {
    const store = makeStore()

    store.set(moveSelectionCommand, { ids: ['a', 'b'], dx: 2, dy: 2 })

    const doc = store.get(documentAtom)
    const a = doc.shapes.find((s) => s.id === 'a')
    const b = doc.shapes.find((s) => s.id === 'b')
    expect(a?.x).toBe(2)
    expect(a?.y).toBe(2)
    expect(b?.x).toBe(12)
    expect(b?.y).toBe(12)
  })

  it('does not modify shapes not in ids', () => {
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(moveSelectionCommand, { ids: ['a'], dx: 5, dy: 5 })

    const doc = store.get(documentAtom)
    const c = doc.shapes.find((s) => s.id === 'c')
    const cBefore = before.shapes.find((s) => s.id === 'c')
    expect(c).toBe(cBefore)
  })

  it('pushes a history entry labelled "Move selection"', () => {
    const store = makeStore()

    store.set(moveSelectionCommand, { ids: ['a'], dx: 1, dy: 1 })

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Move selection')
  })

  it('is a no-op on empty ids', () => {
    const store = makeStore()

    store.set(moveSelectionCommand, { ids: [], dx: 5, dy: 5 })

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('is a no-op on zero delta', () => {
    const store = makeStore()

    store.set(moveSelectionCommand, { ids: ['a'], dx: 0, dy: 0 })

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('is a no-op when ids contain only non-existent shapes', () => {
    const store = makeStore()

    store.set(moveSelectionCommand, { ids: ['nonexistent', 'also-gone'], dx: 5, dy: 5 })

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('undo restores shape positions', () => {
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(moveSelectionCommand, { ids: ['a', 'b'], dx: 10, dy: 10 })
    store.set(undoCommand)

    expect(store.get(documentAtom)).toBe(before)
  })

  it('undo restores selection', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a', 'b'])

    store.set(moveSelectionCommand, { ids: ['a', 'b'], dx: 5, dy: 5 })
    store.set(undoCommand)

    expect(store.get(selectedIdsAtom)).toEqual(['a', 'b'])
  })

  it('translates with negative delta', () => {
    const store = makeStore()

    store.set(moveSelectionCommand, { ids: ['b'], dx: -3, dy: -7 })

    const doc = store.get(documentAtom)
    const b = doc.shapes.find((s) => s.id === 'b')
    expect(b?.x).toBe(7)
    expect(b?.y).toBe(3)
  })

  it('translates with fractional delta', () => {
    const store = makeStore()

    store.set(moveSelectionCommand, { ids: ['a'], dx: 0.5, dy: 1.5 })

    const doc = store.get(documentAtom)
    const a = doc.shapes.find((s) => s.id === 'a')
    expect(a?.x).toBe(0.5)
    expect(a?.y).toBe(1.5)
  })
})
