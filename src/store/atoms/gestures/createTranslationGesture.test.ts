import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'

import { createTranslationGesture } from './createTranslationGesture'
import { setGestureRegistryForTest } from './registry'

const testDoc = makeDoc([
  makeRect({ id: 'r1', x: 2, y: 2, width: 4, height: 4 }),
  makeRect({ id: 'r2', x: 10, y: 10, width: 6, height: 6 }),
])

describe('createTranslationGesture', () => {
  it('produces a named adapter with the correct name', () => {
    const { adapter } = createTranslationGesture('test-gesture')
    expect(adapter.name).toBe('test-gesture')
  })

  it('sets debug labels from the name parameter', () => {
    const { draftAtom, isActiveAtom } = createTranslationGesture('move')
    expect(draftAtom.debugLabel).toBe('moveDraftAtom')
    expect(isActiveAtom.debugLabel).toBe('isMovingAtom')
  })

  it('draftAtom starts as null', () => {
    const { draftAtom } = createTranslationGesture('t')
    const store = createStore()
    expect(store.get(draftAtom)).toBeNull()
  })

  describe('isActiveAtom lifecycle', () => {
    it('is false when draft is null', () => {
      const { isActiveAtom } = createTranslationGesture('t')
      const store = createStore()
      expect(store.get(isActiveAtom)).toBe(false)
    })

    it('becomes true when draft is set', () => {
      const { draftAtom, isActiveAtom } = createTranslationGesture('t')
      const store = createStore()
      store.set(draftAtom, { ids: ['s1'], dx: 1, dy: 1 })
      expect(store.get(isActiveAtom)).toBe(true)
    })

    it('returns to false when draft is cleared', () => {
      const { draftAtom, isActiveAtom } = createTranslationGesture('t')
      const store = createStore()
      store.set(draftAtom, { ids: ['s1'], dx: 1, dy: 1 })
      store.set(draftAtom, null)
      expect(store.get(isActiveAtom)).toBe(false)
    })
  })

  describe('draftForShapeAtom', () => {
    it('returns null when draft is null', () => {
      const { draftForShapeAtom } = createTranslationGesture('t')
      const store = createStore()
      expect(store.get(draftForShapeAtom('s1'))).toBeNull()
    })

    it('returns {dx,dy} for a shape included in draft', () => {
      const { draftAtom, draftForShapeAtom } = createTranslationGesture('t')
      const store = createStore()
      store.set(draftAtom, { ids: ['s1', 's2'], dx: 5, dy: -3 })
      expect(store.get(draftForShapeAtom('s1'))).toEqual({ dx: 5, dy: -3 })
      expect(store.get(draftForShapeAtom('s2'))).toEqual({ dx: 5, dy: -3 })
    })

    it('returns null for a shape not in draft', () => {
      const { draftAtom, draftForShapeAtom } = createTranslationGesture('t')
      const store = createStore()
      store.set(draftAtom, { ids: ['s1'], dx: 1, dy: 1 })
      expect(store.get(draftForShapeAtom('s2'))).toBeNull()
    })

    it('preserves referential identity when dx/dy are unchanged', () => {
      const { draftAtom, draftForShapeAtom } = createTranslationGesture('t')
      const store = createStore()
      store.set(draftAtom, { ids: ['s1'], dx: 5, dy: 3 })
      const first = store.get(draftForShapeAtom('s1'))

      store.set(draftAtom, { ids: ['s1'], dx: 5, dy: 3 })
      const second = store.get(draftForShapeAtom('s1'))

      expect(first).toBe(second)
    })

    it('returns a new reference when dx/dy change', () => {
      const { draftAtom, draftForShapeAtom } = createTranslationGesture('t')
      const store = createStore()
      store.set(draftAtom, { ids: ['s1'], dx: 5, dy: 3 })
      const first = store.get(draftForShapeAtom('s1'))

      store.set(draftAtom, { ids: ['s1'], dx: 6, dy: 3 })
      const second = store.get(draftForShapeAtom('s1'))

      expect(first).not.toBe(second)
      expect(second).toEqual({ dx: 6, dy: 3 })
    })
  })

  describe('displayBbox contributions', () => {
    it('translates the selection bbox by dx/dy', () => {
      const { adapter } = createTranslationGesture('t')
      const restore = setGestureRegistryForTest([adapter])
      try {
        const store = createStore()
        store.set(documentAtom, testDoc)
        store.set(selectShapesCommand, ['r1'])

        const result = adapter.displayBbox?.({ ids: ['r1'], dx: 3, dy: 7 }, store.get)
        expect(result).toEqual({ kind: 'rect', value: { x: 5, y: 9, width: 4, height: 4 } })
      } finally {
        restore()
      }
    })

    it('returns hide when no selection bbox exists', () => {
      const { adapter } = createTranslationGesture('t')
      const store = createStore()

      const result = adapter.displayBbox?.({ ids: ['x'], dx: 1, dy: 1 }, store.get)
      expect(result).toEqual({ kind: 'hide' })
    })
  })

  it('each call produces independent instances', () => {
    const a = createTranslationGesture('a')
    const b = createTranslationGesture('b')

    expect(a.draftAtom).not.toBe(b.draftAtom)
    expect(a.isActiveAtom).not.toBe(b.isActiveAtom)
    expect(a.adapter).not.toBe(b.adapter)

    const store = createStore()
    store.set(a.draftAtom, { ids: ['x'], dx: 1, dy: 1 })
    expect(store.get(b.draftAtom)).toBeNull()
    expect(store.get(a.isActiveAtom)).toBe(true)
    expect(store.get(b.isActiveAtom)).toBe(false)
  })
})
