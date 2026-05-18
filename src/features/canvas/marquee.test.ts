import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { cancelDraftAtom } from '@/store/atoms/draft'
import { isGestureActiveAtom } from '@/store/atoms/gesture'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import {
  type MarqueeDraft,
  marqueeDraftAtom,
  previewSelectedIdsAtom,
} from '@/store/atoms/marquee-draft'
import { displayedSelectionBboxAtom } from '@/store/atoms/resize-draft'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { undoCommand } from '@/store/commands/historyCommands'
import { clearSelectionCommand, selectShapesCommand } from '@/store/commands/selectionCommands'
import { makeMarqueeDraft } from '@/test/fixtures/marquee'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'

const testDoc = makeDoc([
  makeRect({ id: 'a', x: 0, y: 0, width: 5, height: 5 }),
  makeRect({ id: 'b', x: 10, y: 10, width: 5, height: 5 }),
  makeRect({ id: 'c', x: 20, y: 20, width: 5, height: 5 }),
])

function makeStore() {
  const store = createStore()
  store.set(documentAtom, testDoc)
  return store
}

function armMarquee(
  store: ReturnType<typeof createStore>,
  overrides: Partial<MarqueeDraft> = {},
): MarqueeDraft {
  const draft = makeMarqueeDraft({ startScreen: { x: 100, y: 100 }, ...overrides })
  store.set(marqueeDraftAtom, draft)
  return draft
}

describe('marquee integration: full drag-past-threshold', () => {
  it('commits exactly one history entry with expected selectionAfter', () => {
    const store = makeStore()
    armMarquee(store, { startViewBox: { x: 0, y: 0 }, current: { x: 12, y: 12 } })

    const ids = store.get(previewSelectedIdsAtom)
    store.set(marqueeDraftAtom, null)
    store.set(selectShapesCommand, ids)

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].selectionAfter).toEqual(['a', 'b'])
  })

  it('sub-threshold + no Shift commits a clearSelectionCommand', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a', 'b'])
    armMarquee(store)

    // Simulate sub-threshold: clear draft, dispatch clear
    store.set(marqueeDraftAtom, null)
    store.set(clearSelectionCommand, undefined)

    expect(store.get(selectedIdsAtom)).toEqual([])
    expect(store.get(canUndoAtom)).toBe(true)
    expect(store.get(undoStackAtom)[0].label).toBe('Clear selection')
  })

  it('sub-threshold + Shift commits nothing', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a'])
    armMarquee(store, { additive: true, baseSelection: ['a'] })

    // Simulate sub-threshold + additive: just clear draft
    store.set(marqueeDraftAtom, null)

    expect(store.get(selectedIdsAtom)).toEqual(['a'])
    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('Shift+drag commits symmetric difference', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a', 'c'])

    armMarquee(store, {
      startViewBox: { x: 0, y: 0 },
      current: { x: 12, y: 12 },
      additive: true,
      baseSelection: ['a', 'c'],
    })

    const ids = store.get(previewSelectedIdsAtom)
    store.set(marqueeDraftAtom, null)
    store.set(selectShapesCommand, ids)

    // hits = ['a', 'b'], base = ['a', 'c']
    // sym diff = 'c' (in base, not in hits) + 'b' (in hits, not in base)
    expect(store.get(selectedIdsAtom)).toEqual(['b', 'c'])
  })

  it('Escape mid-drag clears draft and leaves selectedIdsAtom + undo stack untouched', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a'])
    armMarquee(store, { startViewBox: { x: 0, y: 0 }, current: { x: 12, y: 12 } })

    // Escape → cancelDraft
    store.set(cancelDraftAtom)

    expect(store.get(marqueeDraftAtom)).toBe(null)
    expect(store.get(selectedIdsAtom)).toEqual(['a'])
    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('pointercancel clears draft same as Escape', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['b'])
    armMarquee(store, { startViewBox: { x: 0, y: 0 }, current: { x: 22, y: 22 } })

    store.set(cancelDraftAtom)

    expect(store.get(marqueeDraftAtom)).toBe(null)
    expect(store.get(selectedIdsAtom)).toEqual(['b'])
    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('command dispatch during marquee is a no-op (gesture freeze)', () => {
    const store = makeStore()
    armMarquee(store, { startViewBox: { x: 0, y: 0 }, current: { x: 12, y: 12 } })

    expect(store.get(isGestureActiveAtom)).toBe(true)
    store.set(selectShapesCommand, ['c'])

    expect(store.get(selectedIdsAtom)).toEqual([])
    expect(store.get(canUndoAtom)).toBe(false)
  })
})

describe('marquee: isGestureActiveAtom', () => {
  it('returns true while marqueeDraftAtom is set', () => {
    const store = createStore()
    armMarquee(store)
    expect(store.get(isGestureActiveAtom)).toBe(true)
  })

  it('returns false after marqueeDraftAtom is cleared', () => {
    const store = createStore()
    armMarquee(store)
    store.set(marqueeDraftAtom, null)
    expect(store.get(isGestureActiveAtom)).toBe(false)
  })
})

describe('marquee: cancelDraftAtom', () => {
  it('clears marqueeDraftAtom', () => {
    const store = createStore()
    armMarquee(store)
    store.set(cancelDraftAtom)
    expect(store.get(marqueeDraftAtom)).toBe(null)
  })
})

describe('marquee: displayedSelectionBboxAtom', () => {
  it('keeps the pre-drag selection bbox visible during a non-additive marquee', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a'])
    // Marquee covers 'b' but displayed bbox must stay anchored on 'a'.
    armMarquee(store, { startViewBox: { x: 9, y: 9 }, current: { x: 16, y: 16 } })

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 0,
      y: 0,
      width: 5,
      height: 5,
    })
  })

  it('returns null during a non-additive marquee when nothing was pre-selected', () => {
    const store = makeStore()
    armMarquee(store, { startViewBox: { x: 0, y: 0 }, current: { x: 12, y: 12 } })
    expect(store.get(displayedSelectionBboxAtom)).toBe(null)
  })

  it('returns live preview bbox during additive marquee', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a', 'c'])

    armMarquee(store, {
      startViewBox: { x: 0, y: 0 },
      current: { x: 12, y: 12 },
      additive: true,
      baseSelection: ['a', 'c'],
    })

    // hits = ['a','b'], base = ['a','c'] → preview = ['c','b']
    // shape c: (20,20,5,5), shape b: (10,10,5,5) → bbox: (10,10,15,15)
    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 10,
      y: 10,
      width: 15,
      height: 15,
    })
  })

  it('updates preview bbox as marquee area changes', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['a'])

    armMarquee(store, {
      startViewBox: { x: 9, y: 9 },
      current: { x: 16, y: 16 },
      additive: true,
      baseSelection: ['a'],
    })

    // hits = ['b'], base = ['a'] → preview = ['a','b']
    // shape a: (0,0,5,5), shape b: (10,10,5,5) → bbox: (0,0,15,15)
    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 0,
      y: 0,
      width: 15,
      height: 15,
    })

    // Grow the marquee to also cover 'a'
    store.set(marqueeDraftAtom, (prev) =>
      prev ? { ...prev, current: { x: 16, y: 16 }, startViewBox: { x: 0, y: 0 } } : prev,
    )

    // hits = ['a','b'], base = ['a'] → preview = ['b'] (a toggled off)
    // shape b: (10,10,5,5) → bbox: (10,10,5,5)
    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 10,
      y: 10,
      width: 5,
      height: 5,
    })
  })
})

describe('marquee: undo after commit restores prior selection', () => {
  it('single undo after marquee commit restores the prior selection', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['c'])

    armMarquee(store, { startViewBox: { x: 0, y: 0 }, current: { x: 12, y: 12 } })
    const ids = store.get(previewSelectedIdsAtom)
    store.set(marqueeDraftAtom, null)
    store.set(selectShapesCommand, ids)

    expect(store.get(selectedIdsAtom)).toEqual(['a', 'b'])

    store.set(undoCommand)
    expect(store.get(selectedIdsAtom)).toEqual(['c'])
  })
})
