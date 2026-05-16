import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { activeDragAtom, draftShapeAtom } from '@/store/atoms/draft'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { activeToolAtom } from '@/store/atoms/tool'
import type { RectShape } from '@/types/shapes'

import { createCanvasBindings } from './bindings'

function makeStore() {
  return createStore()
}

const draftRect: RectShape = {
  type: 'rect',
  id: '__draft__',
  name: 'Rect',
  visible: true,
  locked: false,
  x: 2,
  y: 2,
  width: 8,
  height: 6,
  fill: '#000',
}

function findEscapeBinding(store: ReturnType<typeof createStore>) {
  const bindings = createCanvasBindings(store)
  const esc = bindings.find((b) => b.key === 'Escape')
  if (!esc) throw new Error('No Escape binding found')
  return esc
}

describe('canvas Escape binding', () => {
  it('clears the active tool when no drag is in progress', () => {
    const store = makeStore()
    store.set(activeToolAtom, 'rect')

    findEscapeBinding(store).run()

    expect(store.get(activeToolAtom)).toBeNull()
  })

  it('cancels the draft and clears the active tool when a drag is in progress', () => {
    const store = makeStore()
    store.set(activeToolAtom, 'rect')
    store.set(draftShapeAtom, draftRect)
    store.set(activeDragAtom, {
      toolId: 'rect',
      pointerId: 1,
      startViewBox: { x: 0, y: 0 },
      startScreen: { x: 0, y: 0 },
    })

    findEscapeBinding(store).run()

    expect(store.get(draftShapeAtom)).toBeNull()
    expect(store.get(activeDragAtom)).toBeNull()
    expect(store.get(activeToolAtom)).toBeNull()
  })

  it('is a no-op when no tool is active and no drag is in progress', () => {
    const store = makeStore()
    store.set(activeToolAtom, null)

    findEscapeBinding(store).run()

    expect(store.get(activeToolAtom)).toBeNull()
    expect(store.get(draftShapeAtom)).toBeNull()
    expect(store.get(activeDragAtom)).toBeNull()
  })

  it('clears the selection when shapes are selected', () => {
    const store = makeStore()
    store.set(selectedIdsAtom, ['s1', 's2'])

    findEscapeBinding(store).run()

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('clears tool, draft and selection together', () => {
    const store = makeStore()
    store.set(activeToolAtom, 'rect')
    store.set(draftShapeAtom, draftRect)
    store.set(activeDragAtom, {
      toolId: 'rect',
      pointerId: 1,
      startViewBox: { x: 0, y: 0 },
      startScreen: { x: 0, y: 0 },
    })
    store.set(selectedIdsAtom, ['s1'])

    findEscapeBinding(store).run()

    expect(store.get(activeToolAtom)).toBeNull()
    expect(store.get(draftShapeAtom)).toBeNull()
    expect(store.get(activeDragAtom)).toBeNull()
    expect(store.get(selectedIdsAtom)).toEqual([])
  })
})
