import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { cancelDraftAtom } from '@/store/atoms/draft'
import { isGestureActiveAtom } from '@/store/atoms/gesture'
import { undoStackAtom } from '@/store/atoms/history'
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
import { seedSelection } from '@/test/seedSelection'

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
    seedSelection(store, ['a', 'b'])
    armMarquee(store)

    store.set(marqueeDraftAtom, null)
    store.set(clearSelectionCommand, undefined)

    expect(store.get(selectedIdsAtom)).toEqual([])
    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Clear selection')
  })

  it('sub-threshold + Shift commits nothing', () => {
    const store = makeStore()
    seedSelection(store, ['a'])
    armMarquee(store, { additive: true, baseSelection: ['a'] })

    store.set(marqueeDraftAtom, null)

    expect(store.get(selectedIdsAtom)).toEqual(['a'])
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('Shift+drag commits symmetric difference', () => {
    const store = makeStore()
    seedSelection(store, ['a', 'c'])

    armMarquee(store, {
      startViewBox: { x: 0, y: 0 },
      current: { x: 12, y: 12 },
      additive: true,
      baseSelection: ['a', 'c'],
    })

    const ids = store.get(previewSelectedIdsAtom)
    store.set(marqueeDraftAtom, null)
    store.set(selectShapesCommand, ids)

    expect(store.get(selectedIdsAtom)).toEqual(['b', 'c'])
  })

  it('Escape mid-drag clears draft and leaves selectedIdsAtom + undo stack untouched', () => {
    const store = makeStore()
    seedSelection(store, ['a'])
    armMarquee(store, { startViewBox: { x: 0, y: 0 }, current: { x: 12, y: 12 } })

    store.set(cancelDraftAtom)

    expect(store.get(marqueeDraftAtom)).toBe(null)
    expect(store.get(selectedIdsAtom)).toEqual(['a'])
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('pointercancel clears draft same as Escape', () => {
    const store = makeStore()
    seedSelection(store, ['b'])
    armMarquee(store, { startViewBox: { x: 0, y: 0 }, current: { x: 22, y: 22 } })

    store.set(cancelDraftAtom)

    expect(store.get(marqueeDraftAtom)).toBe(null)
    expect(store.get(selectedIdsAtom)).toEqual(['b'])
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('command dispatch during marquee is a no-op (gesture freeze)', () => {
    const store = makeStore()
    armMarquee(store, { startViewBox: { x: 0, y: 0 }, current: { x: 12, y: 12 } })

    expect(store.get(isGestureActiveAtom)).toBe(true)
    store.set(selectShapesCommand, ['c'])

    expect(store.get(selectedIdsAtom)).toEqual([])
    expect(store.get(undoStackAtom).length).toBe(0)
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
  it('shows the live hit bbox during a non-additive marquee', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['a'])
    armMarquee(store, { startViewBox: { x: 9, y: 9 }, current: { x: 16, y: 16 } })

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 10,
      y: 10,
      width: 5,
      height: 5,
    })
  })

  it('falls back to the pre-drag bbox when the non-additive marquee has no hits', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['a'])
    armMarquee(store, { startViewBox: { x: 100, y: 100 }, current: { x: 101, y: 101 } })

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 0,
      y: 0,
      width: 5,
      height: 5,
    })
  })

  it('returns null when a non-additive marquee has no hits and no pre-selection', () => {
    const store = makeStore()
    armMarquee(store, { startViewBox: { x: 100, y: 100 }, current: { x: 101, y: 101 } })
    expect(store.get(displayedSelectionBboxAtom)).toBe(null)
  })

  it('returns live preview bbox during additive marquee', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['a', 'c'])

    armMarquee(store, {
      startViewBox: { x: 0, y: 0 },
      current: { x: 12, y: 12 },
      additive: true,
      baseSelection: ['a', 'c'],
    })

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 10,
      y: 10,
      width: 15,
      height: 15,
    })
  })

  it('updates preview bbox as marquee area changes', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['a'])

    armMarquee(store, {
      startViewBox: { x: 9, y: 9 },
      current: { x: 16, y: 16 },
      additive: true,
      baseSelection: ['a'],
    })

    expect(store.get(displayedSelectionBboxAtom)).toEqual({
      x: 0,
      y: 0,
      width: 15,
      height: 15,
    })

    store.set(marqueeDraftAtom, (prev) =>
      prev ? { ...prev, current: { x: 16, y: 16 }, startViewBox: { x: 0, y: 0 } } : prev,
    )

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
    store.set(selectShapesCommand, ['c'])

    armMarquee(store, { startViewBox: { x: 0, y: 0 }, current: { x: 12, y: 12 } })
    const ids = store.get(previewSelectedIdsAtom)
    store.set(marqueeDraftAtom, null)
    store.set(selectShapesCommand, ids)

    expect(store.get(selectedIdsAtom)).toEqual(['a', 'b'])

    store.set(undoCommand)
    expect(store.get(selectedIdsAtom)).toEqual(['c'])
  })
})
