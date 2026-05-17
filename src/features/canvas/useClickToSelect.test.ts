import { act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { undoStackAtom } from '@/store/atoms/history'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { undoCommand } from '@/store/commands/historyCommands'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import { renderHookWithStore } from '@/test/renderWithStore'

import { useClickToSelect } from './useClickToSelect'

const testDoc = makeDoc([
  makeRect({ id: 's1', name: 'S1', width: 5, height: 5 }),
  makeRect({ id: 's2', name: 'S2', x: 5, y: 5, width: 5, height: 5 }),
  makeRect({ id: 'other', name: 'Other', x: 10, y: 10, width: 5, height: 5 }),
  makeRect({ id: 'locked', name: 'Locked', locked: true }),
  makeRect({ id: 'hidden', name: 'Hidden', visible: false }),
])

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
        s.set(documentAtom, testDoc)
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
        s.set(documentAtom, testDoc)
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
        s.set(documentAtom, testDoc)
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
    const { result } = renderHookWithStore(
      () => useClickToSelect('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
      },
    )

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
        s.set(documentAtom, testDoc)
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
    const { result, store } = renderHookWithStore(
      () => useClickToSelect('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
      },
    )

    const { event, stopPropagation } = pointerEvent({ button: 2 })
    act(() => {
      result.current.onPointerDown(event)
    })

    expect(store.get(selectedIdsAtom)).toEqual([])
    expect(stopPropagation).not.toHaveBeenCalled()
  })

  it('clicking the already-selected shape is a no-op (no history entry)', () => {
    const { result, store } = renderHookWithStore(
      () => useClickToSelect('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectedIdsAtom, ['s1'])
      },
    )

    const { event } = pointerEvent()
    act(() => {
      result.current.onPointerDown(event)
    })

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it.each([
    { id: 'locked', shiftKey: false, why: 'locked shape' },
    { id: 'locked', shiftKey: true, why: 'shift+locked shape' },
    { id: 'hidden', shiftKey: false, why: 'hidden shape' },
    { id: 'hidden', shiftKey: true, why: 'shift+hidden shape' },
    { id: 'gone', shiftKey: false, why: 'missing shape' },
  ])('clicking $why leaves selection unchanged', ({ id, shiftKey }) => {
    const { result, store } = renderHookWithStore(
      () => useClickToSelect(id),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectedIdsAtom, ['s1'])
      },
    )

    const { event } = pointerEvent({ shiftKey })
    act(() => {
      result.current.onPointerDown(event)
    })

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
  })

  it('click A then click B produces two history entries; undo restores A', () => {
    const { result, store, rerender } = renderHookWithStore(
      ({ id }: { id: string }) => useClickToSelect(id),
      (s) => {
        s.set(documentAtom, testDoc)
      },
      { initialProps: { id: 's1' } },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent().event)
    })
    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    expect(store.get(undoStackAtom)).toHaveLength(1)

    rerender({ id: 's2' })
    act(() => {
      result.current.onPointerDown(pointerEvent().event)
    })
    expect(store.get(selectedIdsAtom)).toEqual(['s2'])
    expect(store.get(undoStackAtom)).toHaveLength(2)

    store.set(undoCommand)
    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
  })
})
