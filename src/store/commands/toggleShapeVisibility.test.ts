import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { documentAtom } from '@/store/atoms/document'
import { undoStackAtom } from '@/store/atoms/history'
import { restoreSelectionAtom, selectedIdsAtom } from '@/store/atoms/selection'
import type { Document, RectShape } from '@/types/shapes'

import { toggleShapeVisibilityCommand } from './toggleShapeVisibility'

function makeRect(id: string, visible = true): RectShape {
  return {
    type: 'rect',
    id,
    name: 'Rect',
    visible,
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

describe('toggleShapeVisibilityCommand', () => {
  it('hides a visible shape', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })

    store.set(toggleShapeVisibilityCommand, { id: 'a' })

    expect(store.get(documentAtom).shapes[0].visible).toBe(false)
  })

  it('shows a hidden shape', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a', false)] })

    store.set(toggleShapeVisibilityCommand, { id: 'a' })

    expect(store.get(documentAtom).shapes[0].visible).toBe(true)
  })

  it('pushes exactly one history entry', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })

    store.set(toggleShapeVisibilityCommand, { id: 'a' })

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Toggle visibility')
    expect(undo[0].before.shapes[0].visible).toBe(true)
    expect(undo[0].after.shapes[0].visible).toBe(false)
  })

  it('does not change selection', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })
    store.set(restoreSelectionAtom, ['a'])

    store.set(toggleShapeVisibilityCommand, { id: 'a' })

    expect(store.get(selectedIdsAtom)).toEqual(['a'])
  })

  it('is a no-op for an unknown id — no history entry pushed', () => {
    const store = makeStore({ ...emptyDoc, shapes: [makeRect('a')] })

    store.set(toggleShapeVisibilityCommand, { id: 'nonexistent' })

    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(store.get(documentAtom).shapes[0].visible).toBe(true)
  })
})
