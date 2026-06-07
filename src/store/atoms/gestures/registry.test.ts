import type { Getter, PrimitiveAtom } from 'jotai'
import { atom, createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import type { Rect } from '@/lib/geometry/rect'
import { documentAtom } from '@/store/atoms/document'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'

import { draftShapeAtom } from './draw'
import { type MarqueeDraft, marqueeDraftAtom } from './marquee'
import { moveDraftAtom } from './move'
import { nudgeDraftAtom } from './nudge'
import { propertyStepDraftAtom } from './propertyStep'
import {
  anyGestureDraftActiveAtom,
  cancelGesturesAtom,
  type DisplayContribution,
  displayedSelectionBboxFromRegistryAtom,
  type GestureAdapter,
  gestureRegistry,
  isAnyGestureActiveAtom,
  setGestureRegistryForTest,
} from './registry'
import { resizeDraftAtom } from './resize'

function makeAdapter(
  name: string,
  displayBbox?: (draft: string, get: Getter) => DisplayContribution,
): { adapter: GestureAdapter<string>; draftAtom: PrimitiveAtom<string | null> } {
  const draftAtom = atom<string | null>(null)
  return {
    adapter: { name, draftAtom, displayBbox },
    draftAtom,
  }
}

function withAdapters<D>(adapters: readonly GestureAdapter<D>[], fn: () => void) {
  const restore = setGestureRegistryForTest(adapters)
  try {
    fn()
  } finally {
    restore()
  }
}

describe('gestureRegistry', () => {
  it('registers seven adapters in Marquee > Resize > Move > Nudge > Draw > PropertyStep > CornerRadiusStep order', () => {
    expect(gestureRegistry).toHaveLength(7)
    expect(gestureRegistry.map((a) => a.name)).toEqual([
      'marquee',
      'resize',
      'move',
      'nudge',
      'draw',
      'propertyStep',
      'cornerRadiusStep',
    ])
  })
})

describe('isAnyGestureActiveAtom', () => {
  it('returns false when no adapters are registered', () => {
    const store = createStore()
    expect(store.get(isAnyGestureActiveAtom)).toBe(false)
  })

  it('returns false when all drafts are null', () => {
    const { adapter: a } = makeAdapter('a')
    const { adapter: b } = makeAdapter('b')
    withAdapters([a, b], () => {
      const store = createStore()
      expect(store.get(isAnyGestureActiveAtom)).toBe(false)
    })
  })

  it('returns true when exactly one draft is non-null', () => {
    const { adapter: a, draftAtom: draftA } = makeAdapter('a')
    const { adapter: b } = makeAdapter('b')
    withAdapters([a, b], () => {
      const store = createStore()
      store.set(draftA, 'active')
      expect(store.get(isAnyGestureActiveAtom)).toBe(true)
    })
  })

  it('returns true when the second adapter is active', () => {
    const { adapter: a } = makeAdapter('a')
    const { adapter: b, draftAtom: draftB } = makeAdapter('b')
    withAdapters([a, b], () => {
      const store = createStore()
      store.set(draftB, 'active')
      expect(store.get(isAnyGestureActiveAtom)).toBe(true)
    })
  })

  it('returns false when only a blocksCommands:false adapter is active', () => {
    const draftAtom = atom<string | null>(null)
    const nonBlocking: GestureAdapter<string> = {
      name: 'non-blocking',
      draftAtom,
      blocksCommands: false,
    }
    withAdapters([nonBlocking], () => {
      const store = createStore()
      store.set(draftAtom, 'active')
      expect(store.get(isAnyGestureActiveAtom)).toBe(false)
    })
  })

  it('propertyStepDraftAtom does not make isAnyGestureActiveAtom true', () => {
    const store = createStore()
    store.set(propertyStepDraftAtom, { r1: { x: 0, y: 0, width: 10, height: 10 } })
    expect(store.get(isAnyGestureActiveAtom)).toBe(false)
  })

  it('an armed marquee does not make isAnyGestureActiveAtom true', () => {
    const store = createStore()
    store.set(marqueeDraftAtom, {
      pointerId: 1,
      startScreen: { x: 0, y: 0 },
      startViewBox: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
      additive: false,
      baseSelection: [],
    })
    expect(store.get(isAnyGestureActiveAtom)).toBe(false)
  })
})

describe('anyGestureDraftActiveAtom', () => {
  it('is true for a non-blocking gesture like an armed marquee', () => {
    const store = createStore()
    expect(store.get(anyGestureDraftActiveAtom)).toBe(false)
    store.set(marqueeDraftAtom, {
      pointerId: 1,
      startScreen: { x: 0, y: 0 },
      startViewBox: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
      additive: false,
      baseSelection: [],
    })
    expect(store.get(anyGestureDraftActiveAtom)).toBe(true)
  })
})

describe('displayedSelectionBboxFromRegistryAtom precedence', () => {
  const rectA: Rect = { x: 0, y: 0, width: 10, height: 10 }
  const rectB: Rect = { x: 20, y: 20, width: 5, height: 5 }

  it('falls back to selectionBboxAtom when no adapter is active', () => {
    const { adapter: a } = makeAdapter('a', () => ({ kind: 'rect', value: rectA }))
    withAdapters([a], () => {
      const store = createStore()
      const result = store.get(displayedSelectionBboxFromRegistryAtom)
      // Falls through to selectionBboxAtom (null when no shapes selected)
      expect(result).toBeNull()
    })
  })

  it('returns rect from the first active adapter with a rect contribution', () => {
    const { adapter: a, draftAtom: draftA } = makeAdapter('a', () => ({
      kind: 'rect',
      value: rectA,
    }))
    const { adapter: b } = makeAdapter('b', () => ({ kind: 'rect', value: rectB }))
    withAdapters([a, b], () => {
      const store = createStore()
      store.set(draftA, 'active')
      expect(store.get(displayedSelectionBboxFromRegistryAtom)).toEqual(rectA)
    })
  })

  it('respects list order: second adapter wins only when first is inactive', () => {
    const { adapter: a } = makeAdapter('a', () => ({ kind: 'rect', value: rectA }))
    const { adapter: b, draftAtom: draftB } = makeAdapter('b', () => ({
      kind: 'rect',
      value: rectB,
    }))
    withAdapters([a, b], () => {
      const store = createStore()
      store.set(draftB, 'active')
      expect(store.get(displayedSelectionBboxFromRegistryAtom)).toEqual(rectB)
    })
  })

  it('hide contribution returns null', () => {
    const { adapter: a, draftAtom: draftA } = makeAdapter('a', () => ({ kind: 'hide' }))
    withAdapters([a], () => {
      const store = createStore()
      store.set(draftA, 'active')
      expect(store.get(displayedSelectionBboxFromRegistryAtom)).toBeNull()
    })
  })

  it('passThrough skips adapter and continues to next', () => {
    const { adapter: a, draftAtom: draftA } = makeAdapter('a', () => ({ kind: 'passThrough' }))
    const { adapter: b, draftAtom: draftB } = makeAdapter('b', () => ({
      kind: 'rect',
      value: rectB,
    }))
    withAdapters([a, b], () => {
      const store = createStore()
      store.set(draftA, 'active')
      store.set(draftB, 'active')
      expect(store.get(displayedSelectionBboxFromRegistryAtom)).toEqual(rectB)
    })
  })

  it('falls back to selectionBbox when active adapter has no displayBbox', () => {
    const { adapter: a, draftAtom: draftA } = makeAdapter('a')
    withAdapters([a], () => {
      const store = createStore()
      store.set(draftA, 'active')
      // No displayBbox → falls back to selectionBboxAtom (null with no shapes)
      expect(store.get(displayedSelectionBboxFromRegistryAtom)).toBeNull()
    })
  })

  it('passThrough then fallback when no further adapter is active', () => {
    const { adapter: a, draftAtom: draftA } = makeAdapter('a', () => ({ kind: 'passThrough' }))
    const { adapter: b } = makeAdapter('b', () => ({ kind: 'rect', value: rectB }))
    withAdapters([a, b], () => {
      const store = createStore()
      store.set(draftA, 'active')
      // b is not active, so after a passes through, we fall back
      expect(store.get(displayedSelectionBboxFromRegistryAtom)).toBeNull()
    })
  })

  it('passes the actual draft value to displayBbox', () => {
    let received: unknown = undefined
    const { adapter: a, draftAtom: draftA } = makeAdapter('a', (draft) => {
      received = draft
      return { kind: 'rect', value: rectA }
    })
    withAdapters([a], () => {
      const store = createStore()
      store.set(draftA, 'my-draft')
      store.get(displayedSelectionBboxFromRegistryAtom)
      expect(received).toBe('my-draft')
    })
  })

  it('active adapter without displayBbox shadows later active adapters', () => {
    const { adapter: a, draftAtom: draftA } = makeAdapter('a')
    const { adapter: b, draftAtom: draftB } = makeAdapter('b', () => ({
      kind: 'rect',
      value: rectB,
    }))
    withAdapters([a, b], () => {
      const store = createStore()
      store.set(draftA, 'active')
      store.set(draftB, 'active')
      // a has no displayBbox → returns selectionBboxAtom, b is never consulted
      expect(store.get(displayedSelectionBboxFromRegistryAtom)).toBeNull()
    })
  })

  it('chain of passThrough adapters falls through to selectionBboxAtom', () => {
    const { adapter: a, draftAtom: draftA } = makeAdapter('a', () => ({ kind: 'passThrough' }))
    const { adapter: b, draftAtom: draftB } = makeAdapter('b', () => ({ kind: 'passThrough' }))
    withAdapters([a, b], () => {
      const store = createStore()
      store.set(draftA, 'active')
      store.set(draftB, 'active')
      expect(store.get(displayedSelectionBboxFromRegistryAtom)).toBeNull()
    })
  })
})

describe('cancelGesturesAtom', () => {
  it('sets every adapter draft to null', () => {
    const { adapter: a, draftAtom: draftA } = makeAdapter('a')
    const { adapter: b, draftAtom: draftB } = makeAdapter('b')
    const { adapter: c, draftAtom: draftC } = makeAdapter('c')
    withAdapters([a, b, c], () => {
      const store = createStore()
      store.set(draftA, 'active')
      store.set(draftB, 'active')
      store.set(draftC, 'active')
      expect(store.get(isAnyGestureActiveAtom)).toBe(true)

      store.set(cancelGesturesAtom)
      expect(store.get(draftA)).toBeNull()
      expect(store.get(draftB)).toBeNull()
      expect(store.get(draftC)).toBeNull()
      expect(store.get(isAnyGestureActiveAtom)).toBe(false)
    })
  })

  it('is a no-op when no adapters are active', () => {
    const { adapter: a, draftAtom: draftA } = makeAdapter('a')
    withAdapters([a], () => {
      const store = createStore()
      store.set(cancelGesturesAtom)
      expect(store.get(draftA)).toBeNull()
    })
  })

  it('zeroes only the active adapter, leaves already-null ones unchanged', () => {
    const { adapter: a, draftAtom: draftA } = makeAdapter('a')
    const { adapter: b, draftAtom: draftB } = makeAdapter('b')
    withAdapters([a, b], () => {
      const store = createStore()
      store.set(draftA, 'active')
      store.set(cancelGesturesAtom)
      expect(store.get(draftA)).toBeNull()
      expect(store.get(draftB)).toBeNull()
    })
  })
})

describe('at-most-one-active invariant across state space', () => {
  it('verifies each adapter can be the sole active gesture', () => {
    const adapters = Array.from({ length: 3 }, (_, i) => makeAdapter(`adapter-${String(i)}`))
    const adapterList = adapters.map((a) => a.adapter)

    withAdapters(adapterList, () => {
      for (const target of adapters) {
        const store = createStore()
        store.set(target.draftAtom, 'active')

        expect(store.get(isAnyGestureActiveAtom)).toBe(true)

        const activeCount = adapters.filter((a) => store.get(a.draftAtom) !== null).length
        expect(activeCount).toBe(1)
      }
    })
  })

  it('cancelGesturesAtom zeroes all drafts regardless of which is active', () => {
    const adapters = Array.from({ length: 3 }, (_, i) => makeAdapter(`adapter-${String(i)}`))
    const adapterList = adapters.map((a) => a.adapter)

    withAdapters(adapterList, () => {
      for (const target of adapters) {
        const store = createStore()
        store.set(target.draftAtom, 'active')
        store.set(cancelGesturesAtom)

        for (const a of adapters) {
          expect(store.get(a.draftAtom)).toBeNull()
        }
        expect(store.get(isAnyGestureActiveAtom)).toBe(false)
      }
    })
  })
})

describe('GestureAdapter type constraint', () => {
  it('accepts an adapter with only name and draftAtom (no second atom slot)', () => {
    const draftAtom = atom<string | null>(null)
    const adapter: GestureAdapter<string> = {
      name: 'minimal',
      draftAtom,
    }
    expect(adapter.name).toBe('minimal')
    expect(adapter.draftAtom).toBe(draftAtom)
    expect(adapter.displayBbox).toBeUndefined()
  })
})

const testDoc = makeDoc([
  makeRect({ id: 'r1', x: 2, y: 2, width: 4, height: 4 }),
  makeRect({ id: 'r2', x: 10, y: 10, width: 6, height: 6 }),
])

function makeStore() {
  const store = createStore()
  store.set(documentAtom, testDoc)
  return store
}

const sampleMarquee: MarqueeDraft = {
  pointerId: 1,
  startScreen: { x: 0, y: 0 },
  startViewBox: { x: 0, y: 0 },
  current: { x: 8, y: 8 },
  additive: false,
  baseSelection: [],
}

describe('real adapter precedence: Marquee > Resize > Move > Draw', () => {
  it('resize draft wins over move draft', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])
    store.set(resizeDraftAtom, { r1: { x: 0, y: 0, width: 20, height: 20 } })
    store.set(moveDraftAtom, { ids: ['r1'], dx: 100, dy: 100 })

    expect(store.get(displayedSelectionBboxFromRegistryAtom)).toEqual({
      x: 0,
      y: 0,
      width: 20,
      height: 20,
    })
  })

  it('marquee draft wins over resize draft', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])
    store.set(marqueeDraftAtom, {
      ...sampleMarquee,
      startViewBox: { x: 1, y: 1 },
      current: { x: 8, y: 8 },
    })
    store.set(resizeDraftAtom, { r1: { x: 0, y: 0, width: 99, height: 99 } })

    const bbox = store.get(displayedSelectionBboxFromRegistryAtom)
    expect(bbox).toEqual({ x: 2, y: 2, width: 4, height: 4 })
  })

  it('move draft wins over draw draft', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])
    store.set(moveDraftAtom, { ids: ['r1'], dx: 5, dy: 3 })
    store.set(draftShapeAtom, makeRect({ id: '__draft__', x: 100, y: 100, width: 1, height: 1 }))

    expect(store.get(displayedSelectionBboxFromRegistryAtom)).toEqual({
      x: 7,
      y: 5,
      width: 4,
      height: 4,
    })
  })

  it('draw draft shows bboxOf(shape) when it is the only active gesture', () => {
    const store = makeStore()
    store.set(draftShapeAtom, makeRect({ id: '__draft__', x: 3, y: 5, width: 7, height: 9 }))

    expect(store.get(displayedSelectionBboxFromRegistryAtom)).toEqual({
      x: 3,
      y: 5,
      width: 7,
      height: 9,
    })
  })

  it('cancelGesturesAtom clears all real adapter drafts', () => {
    const store = makeStore()
    store.set(marqueeDraftAtom, sampleMarquee)
    store.set(resizeDraftAtom, { r1: { x: 0, y: 0, width: 10, height: 10 } })
    store.set(moveDraftAtom, { ids: ['r1'], dx: 1, dy: 1 })
    store.set(nudgeDraftAtom, { ids: ['r1'], dx: 2, dy: 2 })
    store.set(draftShapeAtom, makeRect({ id: '__draft__', x: 0, y: 0, width: 1, height: 1 }))
    store.set(propertyStepDraftAtom, { r1: { x: 5, y: 5, width: 10, height: 10 } })

    store.set(cancelGesturesAtom)

    expect(store.get(marqueeDraftAtom)).toBeNull()
    expect(store.get(resizeDraftAtom)).toBeNull()
    expect(store.get(moveDraftAtom)).toBeNull()
    expect(store.get(nudgeDraftAtom)).toBeNull()
    expect(store.get(draftShapeAtom)).toBeNull()
    expect(store.get(propertyStepDraftAtom)).toBeNull()
    expect(store.get(isAnyGestureActiveAtom)).toBe(false)
  })

  it('additive-empty marquee suppresses the static bbox (hide path)', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])
    store.set(marqueeDraftAtom, {
      ...sampleMarquee,
      startViewBox: { x: 100, y: 100 },
      current: { x: 101, y: 101 },
      additive: true,
      baseSelection: [],
    })

    expect(store.get(displayedSelectionBboxFromRegistryAtom)).toBeNull()
  })

  it('non-additive empty marquee falls through to static selection bbox', () => {
    const store = makeStore()
    store.set(selectShapesCommand, ['r1'])
    store.set(marqueeDraftAtom, {
      ...sampleMarquee,
      startViewBox: { x: 100, y: 100 },
      current: { x: 101, y: 101 },
    })

    expect(store.get(displayedSelectionBboxFromRegistryAtom)).toEqual({
      x: 2,
      y: 2,
      width: 4,
      height: 4,
    })
  })
})
