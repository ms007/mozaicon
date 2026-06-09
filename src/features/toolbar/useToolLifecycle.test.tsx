import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { draftShapeAtom } from '@/store/atoms/draft'
import { activeToolAtom } from '@/store/atoms/tool'
import { renderHookWithStore } from '@/test/renderWithStore'

import { useToolLifecycle } from './useToolLifecycle'

function setup(initialTool = 'rect') {
  return renderHookWithStore(useToolLifecycle, (store) => {
    store.set(activeToolAtom, initialTool)
  })
}

describe('useToolLifecycle', () => {
  it('returns undefined when no tool is active (null)', () => {
    const { result } = renderHookWithStore(useToolLifecycle)
    expect(result.current).toBeUndefined()
  })

  it('returns the active draw tool', () => {
    const { result } = setup('rect')
    expect(result.current?.id).toBe('rect')
  })

  it('returns undefined for an unknown tool id', () => {
    const { result } = setup('nonexistent')
    expect(result.current).toBeUndefined()
  })

  it('calls onDeactivate on the previous tool when switching away mid-draft', () => {
    const { store, result } = setup('rect')

    store.set(draftShapeAtom, {
      type: 'rect',
      id: '__draft__',
      name: 'Rect',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      fill: '#000',
      corners: DEFAULT_CORNERS,
    })

    act(() => {
      store.set(activeToolAtom, 'select')
    })

    expect(result.current).toBeUndefined()
    expect(store.get(draftShapeAtom)).toBeNull()
  })

  it('does not call onDeactivate when switching to the same tool', () => {
    const { store } = setup('rect')

    store.set(draftShapeAtom, {
      type: 'rect',
      id: '__draft__',
      name: 'Rect',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      fill: '#000',
      corners: DEFAULT_CORNERS,
    })

    act(() => {
      store.set(activeToolAtom, 'rect')
    })

    expect(store.get(draftShapeAtom)).not.toBeNull()
  })

  it('calls onDeactivate on unmount mid-draft', () => {
    const { store, unmount } = setup('rect')

    store.set(draftShapeAtom, {
      type: 'rect',
      id: '__draft__',
      name: 'Rect',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      fill: '#000',
      corners: DEFAULT_CORNERS,
    })

    act(() => {
      unmount()
    })

    expect(store.get(draftShapeAtom)).toBeNull()
  })
})
