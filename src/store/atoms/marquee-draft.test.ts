import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { makeMarqueeDraft } from '@/test/fixtures/marquee'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'

import { marqueeDraftAtom, marqueeRectAtom, previewSelectedIdsAtom } from './marquee-draft'

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

describe('previewSelectedIdsAtom', () => {
  const doc = makeDoc([
    makeRect({ id: 'a', x: 0, y: 0, width: 5, height: 5 }),
    makeRect({ id: 'b', x: 10, y: 10, width: 5, height: 5 }),
    makeRect({ id: 'c', x: 20, y: 20, width: 5, height: 5 }),
    makeRect({ id: 'hidden', x: 0, y: 0, width: 5, height: 5, visible: false }),
    makeRect({ id: 'locked', x: 0, y: 0, width: 5, height: 5, locked: true }),
  ])

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

  it('additive mode: full overlap toggles all off (empty result)', () => {
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
    // hits = ['a'], base = ['a'] → sym diff = empty
    expect(store.get(previewSelectedIdsAtom)).toEqual([])
  })
})
