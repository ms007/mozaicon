import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { documentAtom } from '@/store/atoms/document'
import { marqueeDraftAtom } from '@/store/atoms/gestures/marquee'
import { propertyStepDraftAtom } from '@/store/atoms/gestures/propertyStep'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import type { Document } from '@/types/shapes'

import { commitGeometryFieldAtom } from './commitGeometryField'
import { clearGeometryPreviewAtom, previewGeometryFieldAtom } from './previewGeometryField'

const testDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [
    {
      id: 'r1',
      name: 'Rect 1',
      visible: true,
      locked: false,
      type: 'rect',
      x: 2,
      y: 3,
      width: 10,
      height: 8,
      corners: DEFAULT_CORNERS,
    },
    {
      id: 'r2',
      name: 'Rect 2',
      visible: true,
      locked: false,
      type: 'rect',
      x: 5,
      y: 7,
      width: 10,
      height: 12,
      corners: DEFAULT_CORNERS,
    },
  ],
}

function makeStore(doc: Document = testDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

describe('commitGeometryFieldAtom', () => {
  it('sets x on a single selected shape', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])

    store.set(commitGeometryFieldAtom, { field: 'x', value: 100 })

    const shape = store.get(documentAtom).shapes[0]
    expect(shape).toMatchObject({ id: 'r1', x: 100, y: 3, width: 10, height: 8 })
  })

  it('sets the field on all selected shapes (multi-selection)', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1', 'r2'])

    store.set(commitGeometryFieldAtom, { field: 'x', value: 42 })

    const shapes = store.get(documentAtom).shapes
    expect(shapes[0]).toMatchObject({ id: 'r1', x: 42 })
    expect(shapes[1]).toMatchObject({ id: 'r2', x: 42 })
  })

  it('preserves unrelated geometry fields', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])

    store.set(commitGeometryFieldAtom, { field: 'width', value: 20 })

    const shape = store.get(documentAtom).shapes[0]
    expect(shape).toMatchObject({ x: 2, y: 3, width: 20, height: 8 })
  })

  it('pushes exactly one undo entry', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1', 'r2'])

    store.set(commitGeometryFieldAtom, { field: 'y', value: 0 })

    expect(store.get(undoStackAtom)).toHaveLength(2) // 1 for selection + 1 for geometry
    expect(store.get(canUndoAtom)).toBe(true)
  })

  it('does nothing when no shapes are selected', () => {
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(commitGeometryFieldAtom, { field: 'x', value: 100 })

    expect(store.get(documentAtom)).toBe(before)
  })

  it('commits while a marquee draft is active (blur during background click)', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])
    store.set(marqueeDraftAtom, {
      pointerId: 1,
      startScreen: { x: 0, y: 0 },
      startViewBox: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
      additive: false,
      baseSelection: [],
    })

    store.set(commitGeometryFieldAtom, { field: 'x', value: 100 })

    expect(store.get(documentAtom).shapes[0]).toMatchObject({ id: 'r1', x: 100 })
  })

  it('is a no-op when the value is already current', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])
    const stackBefore = store.get(undoStackAtom).length

    store.set(commitGeometryFieldAtom, { field: 'x', value: 2 })

    expect(store.get(undoStackAtom)).toHaveLength(stackBefore)
  })
})

describe('previewGeometryFieldAtom', () => {
  it('sets propertyStepDraftAtom with the preview geometry', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])

    store.set(previewGeometryFieldAtom, { field: 'x', value: 50 })

    const draft = store.get(propertyStepDraftAtom)
    expect(draft).toEqual({ r1: { x: 50, y: 3, width: 10, height: 8 } })
  })

  it('does not modify the document', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])
    const before = store.get(documentAtom)

    store.set(previewGeometryFieldAtom, { field: 'x', value: 50 })

    expect(store.get(documentAtom)).toBe(before)
  })

  it('does not push an undo entry', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])
    const stackBefore = store.get(undoStackAtom).length

    store.set(previewGeometryFieldAtom, { field: 'x', value: 50 })

    expect(store.get(undoStackAtom)).toHaveLength(stackBefore)
  })

  it('sets draft for all selected shapes', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1', 'r2'])

    store.set(previewGeometryFieldAtom, { field: 'y', value: 99 })

    const draft = store.get(propertyStepDraftAtom)
    expect(draft).toEqual({
      r1: { x: 2, y: 99, width: 10, height: 8 },
      r2: { x: 5, y: 99, width: 10, height: 12 },
    })
  })

  it('does nothing when no shapes are selected', () => {
    const store = makeStore()

    store.set(previewGeometryFieldAtom, { field: 'x', value: 50 })

    expect(store.get(propertyStepDraftAtom)).toBeNull()
  })
})

describe('clearGeometryPreviewAtom', () => {
  it('clears the propertyStepDraftAtom', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])
    store.set(previewGeometryFieldAtom, { field: 'x', value: 50 })
    expect(store.get(propertyStepDraftAtom)).not.toBeNull()

    store.set(clearGeometryPreviewAtom)

    expect(store.get(propertyStepDraftAtom)).toBeNull()
  })
})
