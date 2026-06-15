import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { paintPreviewDraftAtom } from '@/store/atoms/gestures/paintPreview'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { commitFillColorAtom } from './commitFillColor'
import { clearFillColorPreviewAtom, previewFillColorAtom } from './previewFillColor'

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
  fill: '#cccccc',
}

const testDoc: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [baseRect, { ...baseRect, id: 'r2', fill: '#f00' }],
}

function makeStore(doc: Icon = testDoc) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  return store
}

describe('previewFillColorAtom', () => {
  it('sets paintPreviewDraftAtom with the preview fill color', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })

    store.set(previewFillColorAtom, '#00ff00')

    const draft = store.get(paintPreviewDraftAtom)
    expect(draft).toEqual({ r1: { fill: '#00ff00' } })
  })

  it('does not modify the document', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })
    const before = store.get(activeIconAtom)

    store.set(previewFillColorAtom, '#00ff00')

    expect(store.get(activeIconAtom)).toBe(before)
  })

  it('does not push an undo entry', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })
    const stackBefore = store.get(undoStackAtom).length

    store.set(previewFillColorAtom, '#00ff00')

    expect(store.get(undoStackAtom)).toHaveLength(stackBefore)
  })

  it('sets draft for all selected shapes', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1', 'r2'], doc: testDoc })

    store.set(previewFillColorAtom, '#0000ff')

    const draft = store.get(paintPreviewDraftAtom)
    expect(draft).toEqual({
      r1: { fill: '#0000ff' },
      r2: { fill: '#0000ff' },
    })
  })

  it('does nothing when no shapes are selected', () => {
    const store = makeStore()

    store.set(previewFillColorAtom, '#00ff00')

    expect(store.get(paintPreviewDraftAtom)).toBeNull()
  })
})

describe('clearFillColorPreviewAtom', () => {
  it('clears the paintPreviewDraftAtom', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })
    store.set(previewFillColorAtom, '#00ff00')
    expect(store.get(paintPreviewDraftAtom)).not.toBeNull()

    store.set(clearFillColorPreviewAtom)

    expect(store.get(paintPreviewDraftAtom)).toBeNull()
  })
})

describe('commitFillColorAtom', () => {
  it('sets fill color on selected shapes and pushes one undo entry', () => {
    const store = makeStore()
    store.set(commitSelectionAtom, { ids: ['r1'], doc: testDoc })

    store.set(commitFillColorAtom, '#ff00ff')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('#ff00ff')
    expect(store.get(canUndoAtom)).toBe(true)
  })

  it('does nothing when no shapes are selected', () => {
    const store = makeStore()
    const before = store.get(activeIconAtom)

    store.set(commitFillColorAtom, '#ff00ff')

    expect(store.get(activeIconAtom)).toBe(before)
  })
})
