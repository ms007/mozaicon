import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { makeMarqueeDraft } from '@/test/fixtures/marquee'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'

import {
  highlightedShapeIdsAtom,
  marqueeDraftAtom,
  marqueeRectAtom,
  previewSelectedIdsAtom,
  previewSelectionBboxAtom,
} from './marquee-draft'

const baseDraft = (overrides?: Parameters<typeof makeMarqueeDraft>[0]) =>
  makeMarqueeDraft({ current: { x: 10, y: 10 }, ...overrides })

describe('marqueeRectAtom', () => {
  it('returns null when no draft', () => {
    const store = createStore()
    expect(store.get(marqueeRectAtom)).toBe(null)
  })

  it('computes rect from startViewBox and current', () => {
    const store = createStore()
    store.set(
      marqueeDraftAtom,
      baseDraft({ startViewBox: { x: 2, y: 3 }, current: { x: 8, y: 7 } }),
    )
    expect(store.get(marqueeRectAtom)).toEqual({ x: 2, y: 3, width: 6, height: 4 })
  })

  it('handles negative drag direction (current < start)', () => {
    const store = createStore()
    store.set(
      marqueeDraftAtom,
      baseDraft({ startViewBox: { x: 8, y: 7 }, current: { x: 2, y: 3 } }),
    )
    expect(store.get(marqueeRectAtom)).toEqual({ x: 2, y: 3, width: 6, height: 4 })
  })
})

const doc = makeDoc([
  makeRect({ id: 'a', x: 0, y: 0, width: 5, height: 5 }),
  makeRect({ id: 'b', x: 10, y: 10, width: 5, height: 5 }),
  makeRect({ id: 'c', x: 20, y: 20, width: 5, height: 5 }),
  makeRect({ id: 'hidden', x: 0, y: 0, width: 5, height: 5, visible: false }),
  makeRect({ id: 'locked', x: 0, y: 0, width: 5, height: 5, locked: true }),
])

describe('previewSelectedIdsAtom', () => {
  it('returns empty when no draft', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    expect(store.get(previewSelectedIdsAtom)).toEqual([])
  })

  it('replace mode: selects shapes whose bbox intersects the marquee', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({ startViewBox: { x: 0, y: 0 }, current: { x: 12, y: 12 } }),
    )
    expect(store.get(previewSelectedIdsAtom)).toEqual(['a', 'b'])
  })

  it('replace mode: excludes hidden and locked shapes', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({ startViewBox: { x: 0, y: 0 }, current: { x: 6, y: 6 } }),
    )
    expect(store.get(previewSelectedIdsAtom)).toEqual(['a'])
  })

  it('additive mode: symmetric difference against baseSelection', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({
        startViewBox: { x: 0, y: 0 },
        current: { x: 12, y: 12 },
        additive: true,
        baseSelection: ['a', 'c'],
      }),
    )
    // hits = ['a', 'b'], base = ['a', 'c']
    // sym diff = remove 'a' from base, keep 'c', add 'b' → ['c', 'b']
    expect(store.get(previewSelectedIdsAtom)).toEqual(['c', 'b'])
  })

  it('additive mode: empty marquee with non-empty base preserves base', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({
        startViewBox: { x: 100, y: 100 },
        current: { x: 101, y: 101 },
        additive: true,
        baseSelection: ['a', 'b'],
      }),
    )
    // hits empty → sym diff = base
    expect(store.get(previewSelectedIdsAtom)).toEqual(['a', 'b'])
  })

  it('replace mode: empty marquee (no hits) returns empty', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({ startViewBox: { x: 100, y: 100 }, current: { x: 101, y: 101 } }),
    )
    expect(store.get(previewSelectedIdsAtom)).toEqual([])
  })
})

describe('highlightedShapeIdsAtom', () => {
  it('returns empty when no draft is active', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    expect(store.get(highlightedShapeIdsAtom)).toEqual([])
  })

  it('highlights the live hits during a non-additive marquee', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({ startViewBox: { x: 0, y: 0 }, current: { x: 12, y: 12 } }),
    )
    expect(store.get(highlightedShapeIdsAtom)).toEqual(['a', 'b'])
  })

  it('non-additive marquee with no hits → no highlights', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({ startViewBox: { x: 100, y: 100 }, current: { x: 101, y: 101 } }),
    )
    expect(store.get(highlightedShapeIdsAtom)).toEqual([])
  })

  it('in-base, not in-marquee → highlighted (still selected)', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({
        startViewBox: { x: 9, y: 9 },
        current: { x: 16, y: 16 },
        additive: true,
        baseSelection: ['a'],
      }),
    )
    // hits = ['b'], base = ['a'] → preview = ['a','b']
    expect(store.get(highlightedShapeIdsAtom)).toContain('a')
  })

  it('in-base, in-marquee → not highlighted (toggled off)', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({
        startViewBox: { x: 0, y: 0 },
        current: { x: 6, y: 6 },
        additive: true,
        baseSelection: ['a'],
      }),
    )
    // hits = ['a'], base = ['a'] → preview = [] (toggled off)
    expect(store.get(highlightedShapeIdsAtom)).not.toContain('a')
  })

  it('not in-base, in-marquee → highlighted (will be added)', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({
        startViewBox: { x: 0, y: 0 },
        current: { x: 6, y: 6 },
        additive: true,
        baseSelection: [],
      }),
    )
    // hits = ['a'], base = [] → preview = ['a']
    expect(store.get(highlightedShapeIdsAtom)).toContain('a')
  })

  it('not in-base, not in-marquee → not highlighted', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({
        startViewBox: { x: 9, y: 9 },
        current: { x: 16, y: 16 },
        additive: true,
        baseSelection: [],
      }),
    )
    // hits = ['b'], base = [] → preview = ['b']
    expect(store.get(highlightedShapeIdsAtom)).not.toContain('a')
    expect(store.get(highlightedShapeIdsAtom)).not.toContain('c')
  })

  it('empty marquee with non-empty base → highlight equals base', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({
        startViewBox: { x: 100, y: 100 },
        current: { x: 101, y: 101 },
        additive: true,
        baseSelection: ['a', 'b'],
      }),
    )
    // hits = [], base = ['a','b'] → preview = ['a','b']
    expect(store.get(highlightedShapeIdsAtom)).toEqual(['a', 'b'])
  })

  it('all four quadrants in one scenario', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({
        startViewBox: { x: 0, y: 0 },
        current: { x: 12, y: 12 },
        additive: true,
        baseSelection: ['a', 'c'],
      }),
    )
    // hits = ['a','b'], base = ['a','c']
    // sym diff: 'c' (base not hit), 'b' (hit not base)
    // 'a' toggled off (base + hit)
    const highlighted = store.get(highlightedShapeIdsAtom)
    expect(highlighted).toContain('c')
    expect(highlighted).toContain('b')
    expect(highlighted).not.toContain('a')
  })
})

describe('previewSelectionBboxAtom', () => {
  it('returns null when no draft is active', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    expect(store.get(previewSelectionBboxAtom)).toBe(null)
  })

  it('returns null when draft has no hits and no base (non-additive)', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({ startViewBox: { x: 100, y: 100 }, current: { x: 101, y: 101 } }),
    )
    expect(store.get(previewSelectionBboxAtom)).toBe(null)
  })

  it('returns bbox of preview shapes during additive marquee', () => {
    const store = createStore()
    store.set(documentAtom, doc)
    store.set(
      marqueeDraftAtom,
      baseDraft({
        startViewBox: { x: 0, y: 0 },
        current: { x: 12, y: 12 },
        additive: true,
        baseSelection: ['a', 'c'],
      }),
    )
    // preview = ['c','b'] → shapes c(20,20,5,5) + b(10,10,5,5) → bbox (10,10,15,15)
    expect(store.get(previewSelectionBboxAtom)).toEqual({
      x: 10,
      y: 10,
      width: 15,
      height: 15,
    })
  })
})

describe('highlightedShapeIdsAtom: recomputes when draft fields change', () => {
  it('toggling additive mid-drag switches between sym-diff and raw hits', () => {
    const store = createStore()
    store.set(documentAtom, doc)

    // 'a' is in base AND in the marquee → sym diff = [].
    store.set(
      marqueeDraftAtom,
      baseDraft({
        startViewBox: { x: 0, y: 0 },
        current: { x: 6, y: 6 },
        additive: true,
        baseSelection: ['a'],
      }),
    )
    expect(store.get(highlightedShapeIdsAtom)).toEqual([])

    // Drop additive. In real UI this can't happen mid-drag (captured at
    // pointerdown per #126); we exercise it here to prove the atom is a
    // pure function of the draft. Non-additive uses raw hits → ['a'].
    store.set(marqueeDraftAtom, (prev) => (prev ? { ...prev, additive: false } : prev))

    expect(store.get(highlightedShapeIdsAtom)).toEqual(['a'])
  })
})
