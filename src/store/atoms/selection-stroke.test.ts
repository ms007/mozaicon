import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { MIXED } from './selection-geometry'
import { selectionStrokeAtom } from './selection-stroke'

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
}

const baseDoc: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [baseRect],
}

function makeStore(doc: Icon = baseDoc, selectedIds: string[] = ['r1']) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  if (selectedIds.length > 0) {
    store.set(commitSelectionAtom, { ids: selectedIds, doc })
  }
  return store
}

function getStroke(store: ReturnType<typeof createStore>) {
  const result = store.get(selectionStrokeAtom)
  if (result === null) throw new Error('Expected non-null selection stroke')
  return result
}

describe('selectionStrokeAtom', () => {
  it('returns null when nothing is selected', () => {
    const store = makeStore(baseDoc, [])
    expect(store.get(selectionStrokeAtom)).toBeNull()
  })

  describe('presence', () => {
    it('returns none when no selected shapes have a stroke', () => {
      const store = makeStore()
      expect(getStroke(store).presence).toBe('none')
    })

    it('returns all when every selected shape has a stroke', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', stroke: '#000', strokeWidth: 2 },
          { ...baseRect, id: 'r2', stroke: '#f00', strokeWidth: 3 },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      expect(getStroke(store).presence).toBe('all')
    })

    it('treats stroke "none" as no stroke', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [{ ...baseRect, stroke: 'none', strokeWidth: 2 }],
      }
      const store = makeStore(doc)
      expect(getStroke(store).presence).toBe('none')
    })

    it('returns some when only part of the selection has a stroke', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', stroke: '#000', strokeWidth: 2 },
          { ...baseRect, id: 'r2' },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      expect(getStroke(store).presence).toBe('some')
    })
  })

  describe('presence: some — derived color and width', () => {
    it('derives color and width from stroked shapes only', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', stroke: '#f00', strokeWidth: 3 },
          { ...baseRect, id: 'r2' },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      const s = getStroke(store)
      expect(s.presence).toBe('some')
      expect(s.color).toBe('#f00')
      expect(s.width).toBe(3)
    })

    it('returns MIXED color when stroked shapes disagree in a partial selection', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', stroke: '#f00', strokeWidth: 2 },
          { ...baseRect, id: 'r2', stroke: '#0f0', strokeWidth: 2 },
          { ...baseRect, id: 'r3' },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2', 'r3'])
      const s = getStroke(store)
      expect(s.presence).toBe('some')
      expect(s.color).toBe(MIXED)
      expect(s.width).toBe(2)
    })
  })

  describe('color', () => {
    it('returns the color when all stroked shapes agree', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', stroke: '#f00', strokeWidth: 2 },
          { ...baseRect, id: 'r2', stroke: '#f00', strokeWidth: 3 },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      expect(getStroke(store).color).toBe('#f00')
    })

    it('returns MIXED when stroked shapes disagree on color', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', stroke: '#f00', strokeWidth: 2 },
          { ...baseRect, id: 'r2', stroke: '#0f0', strokeWidth: 2 },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      expect(getStroke(store).color).toBe(MIXED)
    })

    it('returns undefined when no shapes have a stroke', () => {
      const store = makeStore()
      expect(getStroke(store).color).toBeUndefined()
    })
  })

  describe('width', () => {
    it('returns the width when all stroked shapes agree', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', stroke: '#000', strokeWidth: 3 },
          { ...baseRect, id: 'r2', stroke: '#f00', strokeWidth: 3 },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      expect(getStroke(store).width).toBe(3)
    })

    it('returns MIXED when stroked shapes disagree on width', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', stroke: '#000', strokeWidth: 2 },
          { ...baseRect, id: 'r2', stroke: '#000', strokeWidth: 4 },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      expect(getStroke(store).width).toBe(MIXED)
    })

    it('counts a missing strokeWidth as MIXED disagreement', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', stroke: '#000', strokeWidth: 2 },
          { ...baseRect, id: 'r2', stroke: '#000' },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      expect(getStroke(store).width).toBe(MIXED)
    })

    it('returns undefined when no shapes have a stroke', () => {
      const store = makeStore()
      expect(getStroke(store).width).toBeUndefined()
    })
  })
})
