import { describe, expect, it, vi } from 'vitest'

import type { DrawTool } from '@/features/toolbar/tools/registry'
import type { FrameScheduler } from '@/lib/svg/gestureSampler'
import { undoStackAtom } from '@/store/atoms/history'
import { marqueeDraftAtom } from '@/store/atoms/marquee-draft'
import { activeIconAtom } from '@/store/atoms/project'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { undoCommand } from '@/store/commands/historyCommands'
import { makeIcon, makeRect } from '@/test/fixtures/shapes'
import { renderHookWithStore } from '@/test/renderWithStore'
import { seedSelection } from '@/test/seedSelection'

import { useToolPointerBridge } from './useToolPointerBridge'

const testDoc = makeIcon([
  makeRect({ id: 's1', name: 'S1' }),
  makeRect({ id: 's2', name: 'S2', x: 10, y: 10 }),
])

function makeManualScheduler(): FrameScheduler & { flush(): void; hasPending: boolean } {
  let pending: FrameRequestCallback | null = null
  return {
    request(cb: FrameRequestCallback) {
      pending = cb
      return 1
    },
    cancel() {
      pending = null
    },
    flush() {
      const cb = pending
      pending = null
      cb?.(performance.now())
    },
    get hasPending() {
      return pending !== null
    },
  }
}

function makeTool(overrides: Partial<DrawTool> = {}): DrawTool {
  return {
    id: 'test-tool',
    cursorClass: 'cursor-crosshair',
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
    ...overrides,
  }
}

function makeSvgRef(): React.RefObject<SVGSVGElement | null> & { svg: SVGSVGElement } {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.getScreenCTM = vi.fn().mockReturnValue({
    inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
  })
  const ref = { current: svg } as React.RefObject<SVGSVGElement | null> & { svg: SVGSVGElement }
  ref.svg = svg
  return ref
}

function setup(tool: DrawTool | undefined) {
  const svgRef = makeSvgRef()
  const scheduler = makeManualScheduler()
  const { result, store } = renderHookWithStore(() => useToolPointerBridge(tool, svgRef, scheduler))
  store.set(activeIconAtom, testDoc)
  return { store, result, scheduler }
}

function makePointerEvent(overrides: Record<string, unknown> = {}) {
  const setCapture = vi.fn()
  const releaseCapture = vi.fn()
  const hasCapture = vi.fn().mockReturnValue(true)
  const currentTarget = document.createElement('div')
  currentTarget.setPointerCapture = setCapture
  currentTarget.releasePointerCapture = releaseCapture
  currentTarget.hasPointerCapture = hasCapture

  const event = {
    button: 0,
    buttons: 1,
    clientX: 100,
    clientY: 100,
    pointerId: 1,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ctrlKey: false,
    preventDefault: vi.fn(),
    currentTarget,
    ...overrides,
  } as unknown as React.PointerEvent

  return { event, setCapture, releaseCapture, hasCapture }
}

function mouseEvent() {
  const preventDefault = vi.fn()
  return { event: { preventDefault } as unknown as React.MouseEvent, preventDefault }
}

describe('useToolPointerBridge', () => {
  it('returns handler functions', () => {
    const svgRef = makeSvgRef()
    const { result } = renderHookWithStore(() => useToolPointerBridge(makeTool(), svgRef))
    expect(result.current.onPointerDown).toBeInstanceOf(Function)
    expect(result.current.onPointerMove).toBeInstanceOf(Function)
    expect(result.current.onPointerUp).toBeInstanceOf(Function)
    expect(result.current.onPointerCancel).toBeInstanceOf(Function)
    expect(result.current.onContextMenu).toBeInstanceOf(Function)
  })

  it('sets pointer capture on currentTarget on pointerdown', () => {
    const tool = makeTool()
    const { result } = setup(tool)
    const { event, setCapture } = makePointerEvent({ pointerId: 42 })

    result.current.onPointerDown(event)

    expect(setCapture).toHaveBeenCalledWith(42)
    expect(tool.onPointerDown).toHaveBeenCalled()
  })

  it('releases pointer capture on currentTarget on pointerup', () => {
    const tool = makeTool()
    const { result } = setup(tool)
    const { event, releaseCapture } = makePointerEvent({ pointerId: 42 })

    result.current.onPointerDown(makePointerEvent().event)
    result.current.onPointerUp(event)

    expect(releaseCapture).toHaveBeenCalledWith(42)
    expect(tool.onPointerUp).toHaveBeenCalled()
  })

  it('releases pointer capture on currentTarget on pointercancel', () => {
    const tool = makeTool()
    const { result } = setup(tool)
    const { event, releaseCapture } = makePointerEvent({ pointerId: 42 })

    result.current.onPointerCancel(event)

    expect(releaseCapture).toHaveBeenCalledWith(42)
  })

  it('short-circuits pointermove when shouldHandlePointerMove returns false', () => {
    const tool = makeTool({ shouldHandlePointerMove: vi.fn().mockReturnValue(false) })
    const { result } = setup(tool)

    result.current.onPointerDown(makePointerEvent().event)
    result.current.onPointerMove(makePointerEvent().event)

    expect(tool.shouldHandlePointerMove).toHaveBeenCalled()
    expect(tool.onPointerMove).not.toHaveBeenCalled()
  })

  it('forwards pointermove when shouldHandlePointerMove returns true', () => {
    const tool = makeTool({ shouldHandlePointerMove: vi.fn().mockReturnValue(true) })
    const { result, scheduler } = setup(tool)

    result.current.onPointerDown(makePointerEvent().event)
    result.current.onPointerMove(makePointerEvent().event)
    scheduler.flush()

    expect(tool.onPointerMove).toHaveBeenCalled()
  })

  it('forwards pointermove when shouldHandlePointerMove is not defined', () => {
    const tool = makeTool()
    const { result, scheduler } = setup(tool)

    result.current.onPointerDown(makePointerEvent().event)
    result.current.onPointerMove(makePointerEvent().event)
    scheduler.flush()

    expect(tool.onPointerMove).toHaveBeenCalled()
  })

  it('ignores pointerdown for non-primary button', () => {
    const tool = makeTool()
    const { result } = setup(tool)
    const { event, setCapture } = makePointerEvent({ button: 2 })

    result.current.onPointerDown(event)

    expect(setCapture).not.toHaveBeenCalled()
    expect(tool.onPointerDown).not.toHaveBeenCalled()
  })

  it('pointerdown arms marquee and captures pointer on currentTarget when tool is undefined', () => {
    const { result } = setup(undefined)
    const { event, setCapture } = makePointerEvent({ pointerId: 7 })

    result.current.onPointerDown(event)

    expect(setCapture).toHaveBeenCalledWith(7)
  })

  it('sub-threshold pointerup on canvas background clears the selection when no tool is active', () => {
    const { result, store } = setup(undefined)
    seedSelection(store, ['s1', 's2'])

    result.current.onPointerDown(makePointerEvent({ clientX: 100, clientY: 100 }).event)
    result.current.onPointerUp(makePointerEvent({ clientX: 101, clientY: 101 }).event)

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('sub-threshold pointerup on canvas background is a no-op when selection is already empty', () => {
    const { result, store } = setup(undefined)

    result.current.onPointerDown(makePointerEvent({ clientX: 100, clientY: 100 }).event)
    result.current.onPointerUp(makePointerEvent({ clientX: 101, clientY: 101 }).event)

    expect(store.get(selectedIdsAtom)).toEqual([])
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('sub-threshold pointerup pushes a history entry when selection is non-empty', () => {
    const { result, store } = setup(undefined)
    seedSelection(store, ['s1', 's2'])

    result.current.onPointerDown(makePointerEvent({ clientX: 100, clientY: 100 }).event)
    result.current.onPointerUp(makePointerEvent({ clientX: 101, clientY: 101 }).event)

    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Clear selection')
  })

  it('Cmd+Z after sub-threshold pointerup restores previous selection', () => {
    const { result, store } = setup(undefined)
    seedSelection(store, ['s1', 's2'])

    result.current.onPointerDown(makePointerEvent({ clientX: 100, clientY: 100 }).event)
    result.current.onPointerUp(makePointerEvent({ clientX: 101, clientY: 101 }).event)
    expect(store.get(selectedIdsAtom)).toEqual([])

    store.set(undoCommand)
    expect(store.get(selectedIdsAtom)).toEqual(['s1', 's2'])
  })

  it('pointerdown with non-primary button does not clear the selection', () => {
    const { result, store } = setup(undefined)
    seedSelection(store, ['s1'])

    result.current.onPointerDown(makePointerEvent({ button: 2 }).event)

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
  })

  it('pointerdown with active tool does not auto-clear the selection', () => {
    const tool = makeTool()
    const { result, store } = setup(tool)
    seedSelection(store, ['s1'])

    result.current.onPointerDown(makePointerEvent().event)

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    expect(tool.onPointerDown).toHaveBeenCalled()
  })

  it('pointermove updates marqueeDraftAtom.current during active marquee after frame flush', () => {
    const { result, store, scheduler } = setup(undefined)

    result.current.onPointerDown(makePointerEvent({ clientX: 0, clientY: 0 }).event)
    result.current.onPointerMove(makePointerEvent({ clientX: 15, clientY: 15 }).event)
    scheduler.flush()

    const draft = store.get(marqueeDraftAtom)
    expect(draft?.current).toEqual({ x: 15, y: 15 })
  })

  it('pointermove is a no-op when tool is undefined and no marquee is active', () => {
    const { result } = setup(undefined)

    expect(() => {
      result.current.onPointerMove(makePointerEvent().event)
    }).not.toThrow()
  })

  it('past-threshold pointerup commits selection via selectShapesCommand', () => {
    const { result, store, scheduler } = setup(undefined)

    result.current.onPointerDown(makePointerEvent({ clientX: 0, clientY: 0 }).event)
    result.current.onPointerMove(makePointerEvent({ clientX: 12, clientY: 12 }).event)
    scheduler.flush()
    result.current.onPointerUp(makePointerEvent({ clientX: 12, clientY: 12 }).event)

    expect(store.get(marqueeDraftAtom)).toBe(null)
    expect(store.get(selectedIdsAtom)).toEqual(['s1', 's2'])
    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0].label).toBe('Select shapes')
  })

  it('Shift+pointerdown arms additive marquee with baseSelection', () => {
    const { result, store } = setup(undefined)
    seedSelection(store, ['s1'])

    result.current.onPointerDown(makePointerEvent({ clientX: 0, clientY: 0, shiftKey: true }).event)

    const draft = store.get(marqueeDraftAtom)
    expect(draft?.additive).toBe(true)
    expect(draft?.baseSelection).toEqual(['s1'])
  })

  it('sub-threshold Shift+pointerup preserves selection (no command dispatched)', () => {
    const { result, store } = setup(undefined)
    seedSelection(store, ['s1'])

    result.current.onPointerDown(
      makePointerEvent({ clientX: 100, clientY: 100, shiftKey: true }).event,
    )
    result.current.onPointerUp(makePointerEvent({ clientX: 101, clientY: 101 }).event)

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('pointerup releases pointer capture on currentTarget even when tool is undefined', () => {
    const { result } = setup(undefined)
    const { event, releaseCapture } = makePointerEvent({ pointerId: 42 })

    result.current.onPointerDown(makePointerEvent().event)
    result.current.onPointerUp(event)

    expect(releaseCapture).toHaveBeenCalledWith(42)
  })

  it('pointerup does not release pointer capture when capture is not held', () => {
    const { result } = setup(undefined)
    const { event, releaseCapture, hasCapture } = makePointerEvent({ pointerId: 42 })
    hasCapture.mockReturnValue(false)

    result.current.onPointerDown(makePointerEvent().event)
    result.current.onPointerUp(event)

    expect(releaseCapture).not.toHaveBeenCalled()
  })

  it('pointerup releases capture on currentTarget even when tool.onPointerUp throws', () => {
    const tool = makeTool({
      onPointerUp: vi.fn(() => {
        throw new Error('tool exploded')
      }),
    })
    const { result } = setup(tool)
    const { event, releaseCapture } = makePointerEvent({ pointerId: 7 })

    result.current.onPointerDown(makePointerEvent().event)

    expect(() => {
      result.current.onPointerUp(event)
    }).toThrow('tool exploded')
    expect(releaseCapture).toHaveBeenCalledWith(7)
  })

  it('contextMenu prevents default when shouldHandlePointerMove returns true', () => {
    const tool = makeTool({ shouldHandlePointerMove: vi.fn().mockReturnValue(true) })
    const svgRef = makeSvgRef()
    const { result } = renderHookWithStore(() => useToolPointerBridge(tool, svgRef))
    const { event, preventDefault } = mouseEvent()

    result.current.onContextMenu(event)

    expect(preventDefault).toHaveBeenCalled()
  })

  it('contextMenu does not prevent default when tool is undefined', () => {
    const svgRef = makeSvgRef()
    const { result } = renderHookWithStore(() => useToolPointerBridge(undefined, svgRef))
    const { event, preventDefault } = mouseEvent()

    result.current.onContextMenu(event)

    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('contextMenu does not prevent default when shouldHandlePointerMove returns false', () => {
    const tool = makeTool({ shouldHandlePointerMove: vi.fn().mockReturnValue(false) })
    const svgRef = makeSvgRef()
    const { result } = renderHookWithStore(() => useToolPointerBridge(tool, svgRef))
    const { event, preventDefault } = mouseEvent()

    result.current.onContextMenu(event)

    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('contextMenu does not prevent default when shouldHandlePointerMove is not defined', () => {
    const tool = makeTool()
    const svgRef = makeSvgRef()
    const { result } = renderHookWithStore(() => useToolPointerBridge(tool, svgRef))
    const { event, preventDefault } = mouseEvent()

    result.current.onContextMenu(event)

    expect(preventDefault).not.toHaveBeenCalled()
  })

  describe('Gesture Sampler integration', () => {
    it('marquee draft write is frame-throttled (not immediate on pointermove)', () => {
      const { result, store } = setup(undefined)

      result.current.onPointerDown(makePointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(makePointerEvent({ clientX: 15, clientY: 15 }).event)

      const draft = store.get(marqueeDraftAtom)
      expect(draft?.current).toEqual({ x: 0, y: 0 })
    })

    it('marquee coalesces multiple pointermoves into one draft write per frame', () => {
      const { result, store, scheduler } = setup(undefined)

      result.current.onPointerDown(makePointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(makePointerEvent({ clientX: 5, clientY: 5 }).event)
      result.current.onPointerMove(makePointerEvent({ clientX: 10, clientY: 10 }).event)
      result.current.onPointerMove(makePointerEvent({ clientX: 15, clientY: 15 }).event)
      scheduler.flush()

      const draft = store.get(marqueeDraftAtom)
      expect(draft?.current).toEqual({ x: 15, y: 15 })
    })

    it('pointerup recomputes selection from release coordinate, not last frame draft', () => {
      const { result, store } = setup(undefined)

      result.current.onPointerDown(makePointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(makePointerEvent({ clientX: 5, clientY: 5 }).event)
      // Don't flush — draft.current is still at start point
      // Release at a position that covers both shapes
      result.current.onPointerUp(makePointerEvent({ clientX: 20, clientY: 20 }).event)

      expect(store.get(marqueeDraftAtom)).toBe(null)
      expect(store.get(selectedIdsAtom)).toEqual(['s1', 's2'])
    })

    it('sampler is discarded on pointercancel', () => {
      const { result, store, scheduler } = setup(undefined)

      result.current.onPointerDown(makePointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(makePointerEvent({ clientX: 15, clientY: 15 }).event)
      result.current.onPointerCancel(makePointerEvent().event)

      // Frame fires after cancel — should not crash or update draft
      scheduler.flush()
      expect(store.get(marqueeDraftAtom)).toBe(null)
    })

    it('tool pointermove uses sampler for coordinate conversion (no repeated getScreenCTM)', () => {
      const tool = makeTool({ shouldHandlePointerMove: vi.fn().mockReturnValue(true) })
      const svgRef = makeSvgRef()
      const scheduler = makeManualScheduler()
      const { result } = renderHookWithStore(() => useToolPointerBridge(tool, svgRef, scheduler))

      result.current.onPointerDown(makePointerEvent().event)
      const callsBefore = (svgRef.svg.getScreenCTM as ReturnType<typeof vi.fn>).mock.calls.length
      result.current.onPointerMove(makePointerEvent({ clientX: 50, clientY: 50 }).event)
      scheduler.flush()
      const callsAfter = (svgRef.svg.getScreenCTM as ReturnType<typeof vi.fn>).mock.calls.length

      expect(callsAfter - callsBefore).toBe(0)
      expect(tool.onPointerMove).toHaveBeenCalled()
    })

    it('makeToolEvent passes sampler-converted point to tool on pointerdown', () => {
      const tool = makeTool()
      const svgRef = makeSvgRef()
      const scheduler = makeManualScheduler()
      const { result } = renderHookWithStore(() => useToolPointerBridge(tool, svgRef, scheduler))

      result.current.onPointerDown(makePointerEvent({ clientX: 42, clientY: 99 }).event)

      expect(tool.onPointerDown).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ point: { x: 42, y: 99 } }),
      )
    })

    it('second pointerdown stops the previous sampler so stale rAF does not fire', () => {
      const { result, store, scheduler } = setup(undefined)

      result.current.onPointerDown(makePointerEvent({ clientX: 0, clientY: 0 }).event)
      result.current.onPointerMove(makePointerEvent({ clientX: 50, clientY: 50 }).event)

      result.current.onPointerDown(makePointerEvent({ clientX: 5, clientY: 5 }).event)
      scheduler.flush()

      const draft = store.get(marqueeDraftAtom)
      expect(draft?.current).toEqual({ x: 5, y: 5 })
    })
  })
})
