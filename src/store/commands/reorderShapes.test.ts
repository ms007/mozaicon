import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { undoStackAtom } from '@/store/atoms/history'
import { restoreSelectionAtom, selectedIdsAtom } from '@/store/atoms/selection'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import { seedSelection } from '@/test/seedSelection'
import type { Document, RectShape } from '@/types/shapes'

import { undoCommand } from './historyCommands'
import { moveShapeBlockCommand, reorderStepCommand } from './reorderShapes'

/* ── helpers shared by reorder-step tests ── */

function makeInlineRect(id: string, overrides: Partial<RectShape> = {}): RectShape {
  return {
    type: 'rect',
    id,
    name: id,
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    ...overrides,
  }
}

const emptyDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [],
}

function makeReorderStore(doc: Document = emptyDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

function shapeIds(store: ReturnType<typeof createStore>): string[] {
  return store.get(documentAtom).shapes.map((s) => s.id)
}

/* ── reorderStepCommand tests (issue #180) ── */

describe('reorderStepCommand', () => {
  it('brings a selected shape forward by one step', () => {
    const store = makeReorderStore({
      ...emptyDoc,
      shapes: [makeInlineRect('a'), makeInlineRect('b'), makeInlineRect('c')],
    })
    store.set(restoreSelectionAtom, ['b'])

    store.set(reorderStepCommand, { ids: ['b'], direction: 'forward' })

    expect(shapeIds(store)).toEqual(['a', 'c', 'b'])
  })

  it('sends a selected shape backward by one step', () => {
    const store = makeReorderStore({
      ...emptyDoc,
      shapes: [makeInlineRect('a'), makeInlineRect('b'), makeInlineRect('c')],
    })
    store.set(restoreSelectionAtom, ['b'])

    store.set(reorderStepCommand, { ids: ['b'], direction: 'backward' })

    expect(shapeIds(store)).toEqual(['b', 'a', 'c'])
  })

  it('pushes exactly one history entry with correct label', () => {
    const store = makeReorderStore({
      ...emptyDoc,
      shapes: [makeInlineRect('a'), makeInlineRect('b')],
    })
    store.set(restoreSelectionAtom, ['a'])

    store.set(reorderStepCommand, { ids: ['a'], direction: 'forward' })

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Reorder shapes')
    expect(undo[0].before.shapes.map((s) => s.id)).toEqual(['a', 'b'])
    expect(undo[0].after.shapes.map((s) => s.id)).toEqual(['b', 'a'])
  })

  it('re-normalizes selection to the new z-order', () => {
    const store = makeReorderStore({
      ...emptyDoc,
      shapes: [makeInlineRect('a'), makeInlineRect('b'), makeInlineRect('c'), makeInlineRect('d')],
    })
    store.set(restoreSelectionAtom, ['a', 'c'])

    store.set(reorderStepCommand, { ids: ['a', 'c'], direction: 'forward' })

    expect(shapeIds(store)).toEqual(['b', 'a', 'd', 'c'])
    expect(store.get(selectedIdsAtom)).toEqual(['a', 'c'])
  })

  it('is a no-op when shape is already frontmost — no history entry', () => {
    const store = makeReorderStore({
      ...emptyDoc,
      shapes: [makeInlineRect('a'), makeInlineRect('b')],
    })
    store.set(restoreSelectionAtom, ['b'])

    store.set(reorderStepCommand, { ids: ['b'], direction: 'forward' })

    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(shapeIds(store)).toEqual(['a', 'b'])
  })

  it('is a no-op when shape is already backmost — no history entry', () => {
    const store = makeReorderStore({
      ...emptyDoc,
      shapes: [makeInlineRect('a'), makeInlineRect('b')],
    })
    store.set(restoreSelectionAtom, ['a'])

    store.set(reorderStepCommand, { ids: ['a'], direction: 'backward' })

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('undo restores both order and selection', () => {
    const store = makeReorderStore({
      ...emptyDoc,
      shapes: [makeInlineRect('a'), makeInlineRect('b'), makeInlineRect('c')],
    })
    store.set(restoreSelectionAtom, ['a'])

    store.set(reorderStepCommand, { ids: ['a'], direction: 'forward' })
    expect(shapeIds(store)).toEqual(['b', 'a', 'c'])

    store.set(undoCommand)

    expect(shapeIds(store)).toEqual(['a', 'b', 'c'])
    expect(store.get(selectedIdsAtom)).toEqual(['a'])
  })

  it('does not move locked selected shapes', () => {
    const store = makeReorderStore({
      ...emptyDoc,
      shapes: [makeInlineRect('a', { locked: true }), makeInlineRect('b')],
    })
    store.set(restoreSelectionAtom, ['a'])

    store.set(reorderStepCommand, { ids: ['a'], direction: 'forward' })

    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(shapeIds(store)).toEqual(['a', 'b'])
  })
})

/* ── helpers shared by block-move tests ── */

const a = makeRect({ id: 'a', name: 'A' })
const b = makeRect({ id: 'b', name: 'B' })
const c = makeRect({ id: 'c', name: 'C' })
const d = makeRect({ id: 'd', name: 'D' })
const aLocked = makeRect({ id: 'a', name: 'A', locked: true })

function ids(store: ReturnType<typeof createStore>): string[] {
  return store.get(documentAtom).shapes.map((s) => s.id)
}

function setup(shapes = [a, b, c, d]) {
  const store = createStore()
  store.set(documentAtom, makeDoc(shapes))
  return store
}

/* ── moveShapeBlockCommand tests (issue #181) ── */

describe('moveShapeBlockCommand', () => {
  it('moves shapes to front (beforeId=null) and pushes one history entry', () => {
    const store = setup()
    seedSelection(store, ['a'])

    store.set(moveShapeBlockCommand, { ids: ['a'], beforeId: null })

    expect(ids(store)).toEqual(['b', 'c', 'd', 'a'])
    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Reorder shapes')
  })

  it('moves shapes before a target', () => {
    const store = setup()
    seedSelection(store, ['d'])

    store.set(moveShapeBlockCommand, { ids: ['d'], beforeId: 'a' })

    expect(ids(store)).toEqual(['d', 'a', 'b', 'c'])
  })

  it('re-normalizes selection by new z-order after reorder', () => {
    const store = setup()
    seedSelection(store, ['c', 'a'])

    store.set(moveShapeBlockCommand, { ids: ['c', 'a'], beforeId: null })

    expect(store.get(selectedIdsAtom)).toEqual(['a', 'c'])
    expect(ids(store)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('is a no-op when already at target position — no history entry', () => {
    const store = setup()
    seedSelection(store, ['d'])

    store.set(moveShapeBlockCommand, { ids: ['d'], beforeId: null })

    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(ids(store)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('is a no-op for empty ids', () => {
    const store = setup()

    store.set(moveShapeBlockCommand, { ids: [], beforeId: null })

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('is a no-op when all selected shapes are locked', () => {
    const store = setup([aLocked, b, c])

    store.set(moveShapeBlockCommand, { ids: ['a'], beforeId: null })

    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('Cmd+Z restores both order and selection', () => {
    const store = setup()
    seedSelection(store, ['a'])

    store.set(moveShapeBlockCommand, { ids: ['a'], beforeId: null })
    expect(ids(store)).toEqual(['b', 'c', 'd', 'a'])
    expect(store.get(selectedIdsAtom)).toEqual(['a'])

    store.set(undoCommand)

    expect(ids(store)).toEqual(['a', 'b', 'c', 'd'])
    expect(store.get(selectedIdsAtom)).toEqual(['a'])
  })

  it('collapses non-contiguous selection into a block preserving relative order', () => {
    const store = setup()
    seedSelection(store, ['a', 'c'])

    store.set(moveShapeBlockCommand, { ids: ['a', 'c'], beforeId: null })

    expect(ids(store)).toEqual(['b', 'd', 'a', 'c'])
  })
})
