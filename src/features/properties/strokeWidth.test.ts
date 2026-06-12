import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { strokePreviewDraftAtom } from '@/store/atoms/gestures/strokePreview'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { commitStrokeWidthAtom } from './commitStrokeWidth'
import { clearStrokePreviewAtom, previewStrokeWidthAtom } from './previewStrokeWidth'

const baseRect: RectShape = {
  id: 'r1',
  type: 'rect',
  name: 'Rect',
  visible: true,
  locked: false,
  x: 0,
  y: 0,
  width: 10,
  height: 8,
  corners: { radii: [0, 0, 0, 0], style: 'rounded', smoothing: 0 },
  stroke: '#000',
  strokeWidth: 2,
}

const testDoc: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [baseRect, { ...baseRect, id: 'r2', strokeWidth: 3 }],
}

function makeStore(doc: Icon = testDoc) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  return store
}

describe('previewStrokeWidthAtom', () => {
  it('sets strokePreviewDraftAtom with the preview width', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })

    store.set(previewStrokeWidthAtom, 5)

    const draft = store.get(strokePreviewDraftAtom)
    expect(draft).toEqual({ r1: { strokeWidth: 5 } })
  })

  it('does not modify the document', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })
    const before = store.get(activeIconAtom)

    store.set(previewStrokeWidthAtom, 5)

    expect(store.get(activeIconAtom)).toBe(before)
  })

  it('does not push an undo entry', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })
    const stackBefore = store.get(undoStackAtom).length

    store.set(previewStrokeWidthAtom, 5)

    expect(store.get(undoStackAtom)).toHaveLength(stackBefore)
  })

  it('sets draft for all selected shapes', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1', 'r2'], doc: testDoc })

    store.set(previewStrokeWidthAtom, 7)

    const draft = store.get(strokePreviewDraftAtom)
    expect(draft).toEqual({
      r1: { strokeWidth: 7 },
      r2: { strokeWidth: 7 },
    })
  })

  it('does nothing when no shapes are selected', () => {
    const store = makeStore()

    store.set(previewStrokeWidthAtom, 5)

    expect(store.get(strokePreviewDraftAtom)).toBeNull()
  })
})

describe('clearStrokePreviewAtom', () => {
  it('clears the strokePreviewDraftAtom', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })
    store.set(previewStrokeWidthAtom, 5)
    expect(store.get(strokePreviewDraftAtom)).not.toBeNull()

    store.set(clearStrokePreviewAtom)

    expect(store.get(strokePreviewDraftAtom)).toBeNull()
  })
})

describe('commitStrokeWidthAtom', () => {
  it('sets strokeWidth on selected shapes and pushes one undo entry', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })

    store.set(commitStrokeWidthAtom, 8)

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.strokeWidth).toBe(8)
    expect(store.get(canUndoAtom)).toBe(true)
  })

  it('does nothing when no shapes are selected', () => {
    const store = makeStore()
    const before = store.get(activeIconAtom)

    store.set(commitStrokeWidthAtom, 8)

    expect(store.get(activeIconAtom)).toBe(before)
  })
})
