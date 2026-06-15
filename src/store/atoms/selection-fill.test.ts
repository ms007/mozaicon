import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { activeIconAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { selectionFillAtom } from './selection-fill'
import { MIXED } from './selection-geometry'

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

function getFill(store: ReturnType<typeof createStore>) {
  const result = store.get(selectionFillAtom)
  if (result === null) throw new Error('Expected non-null selection fill')
  return result
}

describe('selectionFillAtom', () => {
  it('returns null when nothing is selected', () => {
    const store = makeStore(baseDoc, [])
    expect(store.get(selectionFillAtom)).toBeNull()
  })

  describe('presence', () => {
    it('returns none when no selected shapes have a fill (undefined)', () => {
      const store = makeStore()
      expect(getFill(store).presence).toBe('none')
    })

    it('returns none when fill is "none"', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [{ ...baseRect, fill: 'none' }],
      }
      const store = makeStore(doc)
      expect(getFill(store).presence).toBe('none')
    })

    it('returns all when every selected shape has a fill', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', fill: '#f00' },
          { ...baseRect, id: 'r2', fill: '#0f0' },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      expect(getFill(store).presence).toBe('all')
    })

    it('returns some when only part of the selection has a fill', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', fill: '#f00' },
          { ...baseRect, id: 'r2' },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      expect(getFill(store).presence).toBe('some')
    })

    it('returns some when some have "none" and some have a color', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', fill: '#f00' },
          { ...baseRect, id: 'r2', fill: 'none' },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      expect(getFill(store).presence).toBe('some')
    })
  })

  describe('color', () => {
    it('returns the color when all filled shapes agree', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', fill: '#f00' },
          { ...baseRect, id: 'r2', fill: '#f00' },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      expect(getFill(store).color).toBe('#f00')
    })

    it('returns MIXED when filled shapes disagree on color', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', fill: '#f00' },
          { ...baseRect, id: 'r2', fill: '#0f0' },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      expect(getFill(store).color).toBe(MIXED)
    })

    it('returns undefined when no shapes have a fill', () => {
      const store = makeStore()
      expect(getFill(store).color).toBeUndefined()
    })

    it('derives color from filled shapes only in a partial selection', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', fill: '#f00' },
          { ...baseRect, id: 'r2' },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2'])
      const f = getFill(store)
      expect(f.presence).toBe('some')
      expect(f.color).toBe('#f00')
    })

    it('returns MIXED color when filled shapes disagree in a partial selection', () => {
      const doc: Icon = {
        ...baseDoc,
        shapes: [
          { ...baseRect, id: 'r1', fill: '#f00' },
          { ...baseRect, id: 'r2', fill: '#0f0' },
          { ...baseRect, id: 'r3' },
        ],
      }
      const store = makeStore(doc, ['r1', 'r2', 'r3'])
      const f = getFill(store)
      expect(f.presence).toBe('some')
      expect(f.color).toBe(MIXED)
    })
  })
})
