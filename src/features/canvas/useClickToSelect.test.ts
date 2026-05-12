import { act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { selectedIdsAtom } from '@/store/atoms/selection'
import { renderHookWithStore } from '@/test/renderWithStore'

import { useClickToSelect } from './useClickToSelect'

function pointerEvent(overrides: Partial<React.PointerEvent> = {}) {
  const stopPropagation = vi.fn()
  const event = {
    button: 0,
    shiftKey: false,
    stopPropagation,
    ...overrides,
  } as unknown as React.PointerEvent
  return { event, stopPropagation }
}

describe('useClickToSelect', () => {
  it('replaces selection with shape id on plain click', () => {
    const { result, store } = renderHookWithStore(
      () => useClickToSelect('s1'),
      (s) => {
        s.set(selectedIdsAtom, ['other'])
      },
    )

    const { event, stopPropagation } = pointerEvent()
    act(() => {
      result.current.onPointerDown(event)
    })

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    expect(stopPropagation).toHaveBeenCalled()
  })

  it('adds shape id to selection on shift-click when not selected', () => {
    const { result, store } = renderHookWithStore(
      () => useClickToSelect('s2'),
      (s) => {
        s.set(selectedIdsAtom, ['s1'])
      },
    )

    const { event, stopPropagation } = pointerEvent({ shiftKey: true })
    act(() => {
      result.current.onPointerDown(event)
    })

    expect(store.get(selectedIdsAtom)).toEqual(['s1', 's2'])
    expect(stopPropagation).toHaveBeenCalled()
  })

  it('removes shape id from selection on shift-click when already selected', () => {
    const { result, store } = renderHookWithStore(
      () => useClickToSelect('s1'),
      (s) => {
        s.set(selectedIdsAtom, ['s1', 's2'])
      },
    )

    const { event, stopPropagation } = pointerEvent({ shiftKey: true })
    act(() => {
      result.current.onPointerDown(event)
    })

    expect(store.get(selectedIdsAtom)).toEqual(['s2'])
    expect(stopPropagation).toHaveBeenCalled()
  })

  it('calls stopPropagation on every primary click', () => {
    const { result } = renderHookWithStore(() => useClickToSelect('s1'))

    const { event, stopPropagation } = pointerEvent()
    act(() => {
      result.current.onPointerDown(event)
    })

    expect(stopPropagation).toHaveBeenCalledTimes(1)
  })

  it('shift-click removes last selected item, leaving empty selection', () => {
    const { result, store } = renderHookWithStore(
      () => useClickToSelect('s1'),
      (s) => {
        s.set(selectedIdsAtom, ['s1'])
      },
    )

    const { event } = pointerEvent({ shiftKey: true })
    act(() => {
      result.current.onPointerDown(event)
    })

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('ignores non-primary button', () => {
    const { result, store } = renderHookWithStore(() => useClickToSelect('s1'))

    const { event, stopPropagation } = pointerEvent({ button: 2 })
    act(() => {
      result.current.onPointerDown(event)
    })

    expect(store.get(selectedIdsAtom)).toEqual([])
    expect(stopPropagation).not.toHaveBeenCalled()
  })
})
