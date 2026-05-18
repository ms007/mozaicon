import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { activeDragAtom, draftShapeAtom } from '@/store/atoms/draft'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { marqueeDraftAtom } from '@/store/atoms/marquee-draft'
import { moveDraftAtom } from '@/store/atoms/move-draft'
import { resizeDraftAtom } from '@/store/atoms/resize-draft'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { activeToolAtom } from '@/store/atoms/tool'
import { undoCommand } from '@/store/commands/historyCommands'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'

import { createCanvasBindings } from './bindings'

const testDoc = makeDoc([
  makeRect({ id: 's1', name: 'S1' }),
  makeRect({ id: 's2', name: 'S2', x: 10, y: 10 }),
])

function setup() {
  const store = createStore()
  store.set(documentAtom, testDoc)
  const bindings = createCanvasBindings(store)
  const escape = bindings.find((b) => b.key === 'Escape')
  if (!escape) throw new Error('No Escape binding found')
  return { store, escape }
}

describe('canvas Escape priority ladder', () => {
  describe('tier 1: active gesture → cancelDraftAtom', () => {
    it('clears resize draft without clearing selection or tool', () => {
      const { store, escape } = setup()
      store.set(selectedIdsAtom, ['s1', 's2'])
      store.set(activeToolAtom, 'rect')
      store.set(resizeDraftAtom, { s1: { x: 0, y: 0, width: 10, height: 10 } })

      escape.run()

      expect(store.get(resizeDraftAtom)).toBeNull()
      expect(store.get(selectedIdsAtom)).toEqual(['s1', 's2'])
      expect(store.get(activeToolAtom)).toBe('rect')
    })

    it('clears move draft without clearing selection', () => {
      const { store, escape } = setup()
      store.set(selectedIdsAtom, ['s1'])
      store.set(moveDraftAtom, { ids: ['s1'], dx: 10, dy: 5 })

      escape.run()

      expect(store.get(moveDraftAtom)).toBeNull()
      expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    })

    it('clears marquee draft without clearing selection', () => {
      const { store, escape } = setup()
      store.set(selectedIdsAtom, ['s1'])
      store.set(marqueeDraftAtom, {
        pointerId: 1,
        startScreen: { x: 0, y: 0 },
        startViewBox: { x: 0, y: 0 },
        current: { x: 20, y: 20 },
        additive: false,
        baseSelection: [],
      })

      escape.run()

      expect(store.get(marqueeDraftAtom)).toBeNull()
      expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    })

    it('clears active drag draft without clearing selection or tool', () => {
      const { store, escape } = setup()
      store.set(activeToolAtom, 'rect')
      store.set(selectedIdsAtom, ['s1'])
      store.set(draftShapeAtom, makeRect({ id: '__draft__', x: 2, y: 2, width: 8, height: 6 }))
      store.set(activeDragAtom, {
        toolId: 'rect',
        pointerId: 1,
        startViewBox: { x: 0, y: 0 },
        startScreen: { x: 0, y: 0 },
      })

      escape.run()

      expect(store.get(draftShapeAtom)).toBeNull()
      expect(store.get(activeDragAtom)).toBeNull()
      expect(store.get(activeToolAtom)).toBe('rect')
      expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    })
  })

  describe('tier 2: active tool → deactivate', () => {
    it('deactivates tool without clearing selection', () => {
      const { store, escape } = setup()
      store.set(activeToolAtom, 'rect')
      store.set(selectedIdsAtom, ['s1'])

      escape.run()

      expect(store.get(activeToolAtom)).toBeNull()
      expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    })
  })

  describe('tier 3: non-empty selection → clear selection', () => {
    it('clears selection when no gesture and no tool active', () => {
      const { store, escape } = setup()
      store.set(selectedIdsAtom, ['s1', 's2'])

      escape.run()

      expect(store.get(selectedIdsAtom)).toEqual([])
    })

    it('pushes a history entry when clearing a non-empty selection', () => {
      const { store, escape } = setup()
      store.set(selectedIdsAtom, ['s1', 's2'])

      escape.run()

      expect(store.get(canUndoAtom)).toBe(true)
      expect(store.get(undoStackAtom)[0].label).toBe('Clear selection')
    })

    it('Cmd+Z after Escape restores previous selection', () => {
      const { store, escape } = setup()
      store.set(selectedIdsAtom, ['s1', 's2'])

      escape.run()
      expect(store.get(selectedIdsAtom)).toEqual([])

      store.set(undoCommand)
      expect(store.get(selectedIdsAtom)).toEqual(['s1', 's2'])
    })

    it('does not push a history entry when selection is already empty', () => {
      const { store, escape } = setup()

      escape.run()

      expect(store.get(canUndoAtom)).toBe(false)
    })
  })

  it('is a no-op when nothing is active', () => {
    const { store, escape } = setup()

    escape.run()

    expect(store.get(activeDragAtom)).toBeNull()
    expect(store.get(resizeDraftAtom)).toBeNull()
    expect(store.get(marqueeDraftAtom)).toBeNull()
    expect(store.get(moveDraftAtom)).toBeNull()
    expect(store.get(activeToolAtom)).toBeNull()
    expect(store.get(selectedIdsAtom)).toEqual([])
  })
})
