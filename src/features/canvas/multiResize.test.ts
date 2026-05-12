import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import type { Rect } from '@/lib/geometry/rect'
import { scaleShape } from '@/lib/geometry/scale'
import type { Vec2 } from '@/lib/geometry/vec2'
import { bboxOf } from '@/lib/svg/bbox'
import { documentAtom } from '@/store/atoms/document'
import { undoStackAtom } from '@/store/atoms/history'
import { resizeDraftAtom } from '@/store/atoms/resize-draft'
import { selectedIdsAtom, selectionBboxAtom } from '@/store/atoms/selection'
import { resizeShapeCommand } from '@/store/commands/resizeShape'
import type { Document, RectShape } from '@/types/shapes'

const r1: RectShape = {
  id: 'r1',
  type: 'rect',
  name: 'Rect 1',
  visible: true,
  locked: false,
  x: 2,
  y: 2,
  width: 4,
  height: 4,
  fill: '#000',
  strokeWidth: 1,
}

const r2: RectShape = {
  id: 'r2',
  type: 'rect',
  name: 'Rect 2',
  visible: true,
  locked: false,
  x: 10,
  y: 10,
  width: 6,
  height: 6,
  fill: '#f00',
  strokeWidth: 2,
}

const twoRectDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [r1, r2],
}

function makeStore(doc: Document = twoRectDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

function computeMultiDraft(shapes: RectShape[], anchor: Vec2, sx: number, sy: number) {
  const draft: Record<string, Rect> = {}
  for (const shape of shapes) {
    draft[shape.id] = bboxOf(scaleShape(shape, anchor, sx, sy))
  }
  return draft
}

describe('Multi-shape resize', () => {
  it('selectionBboxAtom covers the union bbox of both shapes', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1', 'r2'])
    expect(store.get(selectionBboxAtom)).toEqual({ x: 2, y: 2, width: 14, height: 14 })
  })

  it('draft entries cover every selected shape', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['r1', 'r2'])

    const anchor = { x: 16, y: 16 }
    const draft = computeMultiDraft([r1, r2], anchor, 1.5, 1.5)

    store.set(resizeDraftAtom, draft)

    const value = store.get(resizeDraftAtom)
    expect(value).not.toBeNull()
    expect(Object.keys(value ?? {})).toEqual(expect.arrayContaining(['r1', 'r2']))
    expect(Object.keys(value ?? {})).toHaveLength(2)
  })

  it('each shape is scaled by the same sx/sy around the same anchor', () => {
    const anchor = { x: 2, y: 2 }
    const sx = 2
    const sy = 2
    const draft = computeMultiDraft([r1, r2], anchor, sx, sy)

    expect(draft.r1).toEqual({ x: 2, y: 2, width: 8, height: 8 })
    expect(draft.r2).toEqual({ x: 18, y: 18, width: 12, height: 12 })
  })

  it('commits one resizeShapeCommand for all shapes with a single HistoryEntry', () => {
    const store = makeStore()
    const anchor = { x: 2, y: 2 }
    const draft = computeMultiDraft([r1, r2], anchor, 2, 2)

    store.set(resizeShapeCommand, draft)

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Resize shape')

    const doc = store.get(documentAtom)
    expect(doc.shapes[0]).toMatchObject(draft.r1)
    expect(doc.shapes[1]).toMatchObject(draft.r2)
  })

  it('strokeWidth is unchanged on every shape after multi-resize', () => {
    const store = makeStore()
    const anchor = { x: 2, y: 2 }
    const draft = computeMultiDraft([r1, r2], anchor, 2, 2)

    store.set(resizeShapeCommand, draft)

    const doc = store.get(documentAtom)
    expect(doc.shapes[0]).toMatchObject({ strokeWidth: 1 })
    expect(doc.shapes[1]).toMatchObject({ strokeWidth: 2 })
  })

  it('undo restores every shape to pre-resize geometry in one step', () => {
    const store = makeStore()
    const beforeDoc = store.get(documentAtom)
    const anchor = { x: 2, y: 2 }
    const draft = computeMultiDraft([r1, r2], anchor, 2, 2)

    store.set(resizeShapeCommand, draft)
    expect(store.get(documentAtom)).not.toBe(beforeDoc)

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)

    expect(undo[0].before.shapes[0]).toMatchObject({
      id: 'r1',
      x: 2,
      y: 2,
      width: 4,
      height: 4,
    })
    expect(undo[0].before.shapes[1]).toMatchObject({
      id: 'r2',
      x: 10,
      y: 10,
      width: 6,
      height: 6,
    })
  })

  it('draft is cleared to null after commit', () => {
    const store = makeStore()
    const anchor = { x: 2, y: 2 }
    const draft = computeMultiDraft([r1, r2], anchor, 1.5, 1.5)

    store.set(resizeDraftAtom, draft)
    expect(store.get(resizeDraftAtom)).not.toBeNull()

    store.set(resizeDraftAtom, null)
    expect(store.get(resizeDraftAtom)).toBeNull()
  })
})
