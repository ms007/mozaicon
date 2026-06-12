import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { strokePreviewDraftAtom } from '@/store/atoms/gestures/strokePreview'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { commitStrokeColorAtom } from './commitStrokeColor'
import { clearStrokeColorPreviewAtom, previewStrokeColorAtom } from './previewStrokeColor'

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
  shapes: [baseRect, { ...baseRect, id: 'r2', stroke: '#f00' }],
}

function makeStore(doc: Icon = testDoc) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  return store
}

describe('previewStrokeColorAtom', () => {
  it('sets strokePreviewDraftAtom with the preview color', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })

    store.set(previewStrokeColorAtom, '#00ff00')

    const draft = store.get(strokePreviewDraftAtom)
    expect(draft).toEqual({ r1: { stroke: '#00ff00' } })
  })

  it('does not modify the document', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })
    const before = store.get(activeIconAtom)

    store.set(previewStrokeColorAtom, '#00ff00')

    expect(store.get(activeIconAtom)).toBe(before)
  })

  it('does not push an undo entry', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })
    const stackBefore = store.get(undoStackAtom).length

    store.set(previewStrokeColorAtom, '#00ff00')

    expect(store.get(undoStackAtom)).toHaveLength(stackBefore)
  })

  it('sets draft for all selected shapes', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1', 'r2'], doc: testDoc })

    store.set(previewStrokeColorAtom, '#0000ff')

    const draft = store.get(strokePreviewDraftAtom)
    expect(draft).toEqual({
      r1: { stroke: '#0000ff' },
      r2: { stroke: '#0000ff' },
    })
  })

  it('does nothing when no shapes are selected', () => {
    const store = makeStore()

    store.set(previewStrokeColorAtom, '#00ff00')

    expect(store.get(strokePreviewDraftAtom)).toBeNull()
  })
})

describe('clearStrokeColorPreviewAtom', () => {
  it('clears the strokePreviewDraftAtom', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })
    store.set(previewStrokeColorAtom, '#00ff00')
    expect(store.get(strokePreviewDraftAtom)).not.toBeNull()

    store.set(clearStrokeColorPreviewAtom)

    expect(store.get(strokePreviewDraftAtom)).toBeNull()
  })
})

describe('commitStrokeColorAtom', () => {
  it('sets stroke color on selected shapes and pushes one undo entry', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })

    store.set(commitStrokeColorAtom, '#ff00ff')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.stroke).toBe('#ff00ff')
    expect(store.get(canUndoAtom)).toBe(true)
  })

  it('does nothing when no shapes are selected', () => {
    const store = makeStore()
    const before = store.get(activeIconAtom)

    store.set(commitStrokeColorAtom, '#ff00ff')

    expect(store.get(activeIconAtom)).toBe(before)
  })
})
