import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom, projectAtom } from '@/store/atoms/project'
import { commitSelectionAtom } from '@/store/atoms/selection'
import type { Icon, RectShape } from '@/types/shapes'

import { setCornerStyleCommand } from './setCornerStyle'

const baseRect: RectShape = {
  id: 'r1',
  type: 'rect',
  name: 'Rect',
  visible: true,
  locked: false,
  x: 2,
  y: 2,
  width: 10,
  height: 8,
  corners: DEFAULT_CORNERS,
}

const docWithRect: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [baseRect],
}

function makeStore(doc: Icon = docWithRect, selectedIds: string[] = ['r1']) {
  const store = createStore()
  store.set(activeIconAtom, doc)
  if (selectedIds.length > 0) {
    store.set(commitSelectionAtom, { ids: selectedIds, doc })
  }
  return store
}

describe('setCornerStyleCommand', () => {
  it('sets corner style on a selected rect and pushes one undo entry', () => {
    const store = makeStore()

    store.set(setCornerStyleCommand, 'smooth')

    const shape = store.get(activeIconAtom).shapes[0]
    expect(shape.corners.style).toBe('smooth')

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Set corner style')
  })

  it('is a no-op when setting the same style', () => {
    const store = makeStore()

    store.set(setCornerStyleCommand, 'rounded')

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('applies to multiple selected rects', () => {
    const twoRectDoc: Icon = {
      ...docWithRect,
      shapes: [baseRect, { ...baseRect, id: 'r2' }],
    }
    const store = makeStore(twoRectDoc, ['r1', 'r2'])

    store.set(setCornerStyleCommand, 'smooth')

    const shapes = store.get(activeIconAtom).shapes
    expect(shapes[0].corners.style).toBe('smooth')
    expect(shapes[1].corners.style).toBe('smooth')
  })

  it('does not push history when no rects are selected', () => {
    const store = makeStore(docWithRect, [])

    store.set(setCornerStyleCommand, 'smooth')

    expect(store.get(canUndoAtom)).toBe(false)
  })

  it('toggles from smooth back to rounded', () => {
    const store = makeStore({
      ...docWithRect,
      shapes: [{ ...baseRect, corners: { ...DEFAULT_CORNERS, style: 'smooth' as const } }],
    })

    store.set(setCornerStyleCommand, 'rounded')

    expect(store.get(activeIconAtom).shapes[0].corners.style).toBe('rounded')
    expect(store.get(undoStackAtom)).toHaveLength(1)
  })

  it('preserves radii and smoothing when changing style', () => {
    const store = makeStore({
      ...docWithRect,
      shapes: [
        {
          ...baseRect,
          corners: { radii: [1, 2, 3, 4], style: 'rounded' as const, smoothing: 42 },
        },
      ],
    })

    store.set(setCornerStyleCommand, 'smooth')

    const { corners } = store.get(activeIconAtom).shapes[0]
    expect(corners.radii).toEqual([1, 2, 3, 4])
    expect(corners.smoothing).toBe(42)
    expect(corners.style).toBe('smooth')
  })

  it('undo restores the previous style', () => {
    const store = makeStore()
    const before = store.get(projectAtom)

    store.set(setCornerStyleCommand, 'smooth')
    expect(store.get(activeIconAtom).shapes[0].corners.style).toBe('smooth')

    const entry = store.get(undoStackAtom)[0]
    expect(entry.before).toBe(before)
  })
})
