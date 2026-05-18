import { act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { moveDraftAtom } from '@/store/atoms/move-draft'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { undoCommand } from '@/store/commands/historyCommands'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import { renderHookWithStore } from '@/test/renderWithStore'
import { seedSelection } from '@/test/seedSelection'

import { useShapeInteraction } from './useShapeInteraction'

const testDoc = makeDoc([
  makeRect({ id: 's1', name: 'S1', width: 5, height: 5 }),
  makeRect({ id: 's2', name: 'S2', x: 5, y: 5, width: 5, height: 5 }),
  makeRect({ id: 'other', name: 'Other', x: 10, y: 10, width: 5, height: 5 }),
  makeRect({ id: 'locked', name: 'Locked', locked: true }),
  makeRect({ id: 'hidden', name: 'Hidden', visible: false }),
])

function makeSvgElement() {
  return { getScreenCTM: () => null } as unknown as SVGSVGElement
}

function pointerEvent(overrides: Partial<React.PointerEvent> = {}) {
  const stopPropagation = vi.fn()
  const setPointerCapture = vi.fn()
  const hasPointerCapture = vi.fn(() => true)
  const releasePointerCapture = vi.fn()
  const ownerSVGElement = makeSvgElement()

  const event = {
    button: 0,
    pointerId: 1,
    shiftKey: false,
    clientX: 0,
    clientY: 0,
    stopPropagation,
    currentTarget: { setPointerCapture, hasPointerCapture, releasePointerCapture },
    target: { ownerSVGElement },
    ...overrides,
  } as unknown as React.PointerEvent
  return { event, stopPropagation, setPointerCapture, releasePointerCapture }
}

function clickSequence(
  hook: ReturnType<typeof useShapeInteraction>,
  overrides: Partial<React.PointerEvent> = {},
) {
  const down = pointerEvent(overrides)
  hook.onPointerDown(down.event)
  const up = pointerEvent(overrides)
  hook.onPointerUp(up.event)
  return down
}

describe('useShapeInteraction — click-to-select', () => {
  it('replaces selection with shape id on plain click (pointerup)', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['other'])
      },
    )

    act(() => {
      clickSequence(result.current)
    })

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
  })

  it('adds shape id to selection on shift-click when not selected', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s2'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      clickSequence(result.current, { shiftKey: true })
    })

    expect(store.get(selectedIdsAtom)).toEqual(['s1', 's2'])
  })

  it('removes shape id from selection on shift-click when already selected', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1', 's2'])
      },
    )

    act(() => {
      clickSequence(result.current, { shiftKey: true })
    })

    expect(store.get(selectedIdsAtom)).toEqual(['s2'])
  })

  it('calls stopPropagation on every primary pointerdown', () => {
    const { result } = renderHookWithStore(
      () => useShapeInteraction('s1'),
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
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      clickSequence(result.current, { shiftKey: true })
    })

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('ignores non-primary button', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
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
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        seedSelection(s, ['s1'])
      },
    )

    act(() => {
      clickSequence(result.current)
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
      () => useShapeInteraction(id),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      clickSequence(result.current, { shiftKey })
    })

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
  })

  it('click A then click B produces two history entries; undo restores A', () => {
    const { result, store, rerender } = renderHookWithStore(
      ({ id }: { id: string }) => useShapeInteraction(id),
      (s) => {
        s.set(documentAtom, testDoc)
      },
      { initialProps: { id: 's1' } },
    )

    act(() => {
      clickSequence(result.current)
    })
    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    expect(store.get(canUndoAtom)).toBe(true)

    rerender({ id: 's2' })
    act(() => {
      clickSequence(result.current)
    })
    expect(store.get(selectedIdsAtom)).toEqual(['s2'])
    expect(store.get(canUndoAtom)).toBe(true)

    store.set(undoCommand)
    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
  })

  it('selection fires on pointerup not pointerdown', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['other'])
      },
    )

    const down = pointerEvent()
    act(() => {
      result.current.onPointerDown(down.event)
    })
    expect(store.get(selectedIdsAtom)).toEqual(['other'])

    const up = pointerEvent()
    act(() => {
      result.current.onPointerUp(up.event)
    })
    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
  })
})

describe('useShapeInteraction — drag-to-move', () => {
  it('above-threshold drag on selected shape writes moveDraftAtom', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 10 }).event)
    })

    const draft = store.get(moveDraftAtom)
    expect(draft).toEqual({ ids: ['s1'], dx: 10, dy: 10 })
  })

  it('above-threshold drag on selected shape does not mutate selectedIdsAtom', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1', 's2'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 10 }).event)
    })

    expect(store.get(selectedIdsAtom)).toEqual(['s1', 's2'])
  })

  it('above-threshold drag on unselected shape selects it before writing moveDraftAtom', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s2'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 10 }).event)
    })

    expect(store.get(selectedIdsAtom)).toEqual(['s2'])
    const draft = store.get(moveDraftAtom)
    expect(draft).toEqual(expect.objectContaining({ ids: ['s2'] }))
  })

  it('above-threshold drag with shift on unselected shape toggles before writing moveDraftAtom', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s2'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0, shiftKey: true }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 10 }).event)
    })

    expect(store.get(selectedIdsAtom)).toEqual(['s1', 's2'])
    const draft = store.get(moveDraftAtom)
    expect(draft).toEqual(expect.objectContaining({ ids: ['s1', 's2'] }))
  })

  it('move set is the full current selection when shape is already selected', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1', 's2', 'other'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 5 }).event)
    })

    const draft = store.get(moveDraftAtom)
    expect(draft).toEqual(expect.objectContaining({ ids: ['s1', 's2', 'other'] }))
  })

  it('pointerup clears moveDraftAtom and dispatches moveSelectionCommand', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 5 }).event)
      result.current.onPointerUp(pointerEvent({ clientX: 10, clientY: 5 }).event)
    })

    expect(store.get(moveDraftAtom)).toBeNull()
    const doc = store.get(documentAtom)
    const shape = doc.shapes.find((s) => s.id === 's1')
    expect(shape?.x).toBe(10)
    expect(shape?.y).toBe(5)
  })

  it('undo after move restores document and selection', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    const docBefore = store.get(documentAtom)
    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 10 }).event)
      result.current.onPointerUp(pointerEvent({ clientX: 10, clientY: 10 }).event)
    })

    store.set(undoCommand)
    expect(store.get(documentAtom)).toBe(docBefore)
    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
  })

  it('sub-threshold movement does not trigger move draft', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 1, clientY: 1 }).event)
    })

    expect(store.get(moveDraftAtom)).toBeNull()
  })

  it('exactly-at-threshold distance triggers move', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 3, clientY: 0 }).event)
    })

    expect(store.get(moveDraftAtom)).not.toBeNull()
  })

  it('onPointerMove without prior onPointerDown is a no-op', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerMove(pointerEvent({ clientX: 50, clientY: 50 }).event)
    })

    expect(store.get(moveDraftAtom)).toBeNull()
  })

  it('onPointerUp without prior onPointerDown is a no-op', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    const docBefore = store.get(documentAtom)
    act(() => {
      result.current.onPointerUp(pointerEvent().event)
    })

    expect(store.get(documentAtom)).toBe(docBefore)
    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
  })

  it('drag on locked shape does not set moveDraftAtom', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('locked'),
      (s) => {
        s.set(documentAtom, testDoc)
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 20, clientY: 20 }).event)
    })

    expect(store.get(moveDraftAtom)).toBeNull()
  })

  it('subsequent pointer-move events update draft to latest position', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 10 }).event)
    })

    expect(store.get(moveDraftAtom)).toEqual({ ids: ['s1'], dx: 10, dy: 10 })

    act(() => {
      result.current.onPointerMove(pointerEvent({ clientX: 5, clientY: 3 }).event)
    })

    expect(store.get(moveDraftAtom)).toEqual({ ids: ['s1'], dx: 5, dy: 3 })
  })

  it('sub-threshold moves still update draft after promotion', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 10 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 1, clientY: 1 }).event)
    })

    expect(store.get(moveDraftAtom)).toEqual({ ids: ['s1'], dx: 1, dy: 1 })
  })

  it('stops updating draft after external cancellation', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 10 }).event)
    })
    expect(store.get(moveDraftAtom)).not.toBeNull()

    store.set(moveDraftAtom, null)

    act(() => {
      result.current.onPointerMove(pointerEvent({ clientX: 20, clientY: 20 }).event)
    })
    expect(store.get(moveDraftAtom)).toBeNull()
  })

  it('pointerup after external cancellation does not commit', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    const docBefore = store.get(documentAtom)
    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 10 }).event)
    })

    store.set(moveDraftAtom, null)

    act(() => {
      result.current.onPointerUp(pointerEvent().event)
    })

    expect(store.get(documentAtom)).toBe(docBefore)
  })
})

describe('useShapeInteraction — axis-lock (Shift)', () => {
  it('Shift constrains motion to horizontal axis when |dx| >= |dy|', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 3, shiftKey: true }).event)
    })

    const draft = store.get(moveDraftAtom)
    expect(draft).toEqual({ ids: ['s1'], dx: 10, dy: 0 })
  })

  it('Shift constrains motion to vertical axis when |dy| > |dx|', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 3, clientY: 10, shiftKey: true }).event)
    })

    const draft = store.get(moveDraftAtom)
    expect(draft).toEqual({ ids: ['s1'], dx: 0, dy: 10 })
  })

  it('releasing Shift mid-gesture restores free motion', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 3, shiftKey: true }).event)
    })
    expect(store.get(moveDraftAtom)).toEqual({ ids: ['s1'], dx: 10, dy: 0 })

    act(() => {
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 3, shiftKey: false }).event)
    })
    expect(store.get(moveDraftAtom)).toEqual({ ids: ['s1'], dx: 10, dy: 3 })
  })

  it('pressing Shift mid-gesture activates axis-lock', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 3, shiftKey: false }).event)
    })
    expect(store.get(moveDraftAtom)).toEqual({ ids: ['s1'], dx: 10, dy: 3 })

    act(() => {
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 3, shiftKey: true }).event)
    })
    expect(store.get(moveDraftAtom)).toEqual({ ids: ['s1'], dx: 10, dy: 0 })
  })

  it('Shift-constrained drag commits axis-locked delta to document', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 3, shiftKey: true }).event)
      result.current.onPointerUp(pointerEvent({ clientX: 10, clientY: 3 }).event)
    })

    const doc = store.get(documentAtom)
    const shape = doc.shapes.find((s) => s.id === 's1')
    expect(shape?.x).toBe(10)
    expect(shape?.y).toBe(0)
  })

  it('releasing Shift before commit applies unconstrained delta to document', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 3, shiftKey: true }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 3, shiftKey: false }).event)
      result.current.onPointerUp(pointerEvent({ clientX: 10, clientY: 3 }).event)
    })

    const doc = store.get(documentAtom)
    const shape = doc.shapes.find((s) => s.id === 's1')
    expect(shape?.x).toBe(10)
    expect(shape?.y).toBe(3)
  })
})

describe('useShapeInteraction — locked-shape filter', () => {
  it('pointerdown on a locked-only target blocks promotion (moveDraftAtom stays null)', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('locked'),
      (s) => {
        s.set(documentAtom, testDoc)
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 20, clientY: 20 }).event)
    })

    expect(store.get(moveDraftAtom)).toBeNull()
  })

  it('locked-only target still runs click-fallback selection on pointerup', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('locked'),
      (s) => {
        s.set(documentAtom, testDoc)
      },
    )

    act(() => {
      clickSequence(result.current)
    })

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('multi-selection with locked shape excludes locked from moveDraftAtom.ids', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1', 's2', 'locked'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 10 }).event)
    })

    const draft = store.get(moveDraftAtom)
    expect(draft).toEqual(expect.objectContaining({ ids: ['s1', 's2'] }))
    expect(draft?.ids).not.toContain('locked')
  })

  it('multi-selection with hidden shape excludes hidden from moveDraftAtom.ids', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1', 'hidden'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 10 }).event)
    })

    const draft = store.get(moveDraftAtom)
    expect(draft).toEqual(expect.objectContaining({ ids: ['s1'] }))
  })

  it('dragging non-locked shape in selection with only locked others moves only non-locked', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1', 'locked'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 10 }).event)
    })

    const draft = store.get(moveDraftAtom)
    expect(draft).toEqual(expect.objectContaining({ ids: ['s1'] }))
  })

  it('commit after mixed selection moves only unlocked shapes in document', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('s1'),
      (s) => {
        s.set(documentAtom, testDoc)
        s.set(selectShapesCommand, ['s1', 'locked'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 10, clientY: 5 }).event)
      result.current.onPointerUp(pointerEvent({ clientX: 10, clientY: 5 }).event)
    })

    const doc = store.get(documentAtom)
    const s1 = doc.shapes.find((s) => s.id === 's1')
    const locked = doc.shapes.find((s) => s.id === 'locked')
    expect(s1?.x).toBe(10)
    expect(s1?.y).toBe(5)
    expect(locked?.x).toBe(0)
    expect(locked?.y).toBe(0)
  })

  it('all-locked selection: pointerUp after drag attempt does not create history entry', () => {
    const { result, store } = renderHookWithStore(
      () => useShapeInteraction('locked'),
      (s) => {
        s.set(documentAtom, testDoc)
        seedSelection(s, ['locked'])
      },
    )

    act(() => {
      result.current.onPointerDown(pointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(pointerEvent({ clientX: 20, clientY: 20 }).event)
      result.current.onPointerUp(pointerEvent({ clientX: 20, clientY: 20 }).event)
    })

    expect(store.get(undoStackAtom)).toHaveLength(0)
    expect(store.get(moveDraftAtom)).toBeNull()
  })
})
