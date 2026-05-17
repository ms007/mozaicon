import { describe, expect, it, vi } from 'vitest'

import type { DrawTool } from '@/features/toolbar/tools/registry'
import { documentAtom } from '@/store/atoms/document'
import { undoStackAtom } from '@/store/atoms/history'
import { marqueeDraftAtom } from '@/store/atoms/marquee-draft'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { undoCommand } from '@/store/commands/historyCommands'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import { renderHookWithStore } from '@/test/renderWithStore'

import { useToolPointerBridge } from './useToolPointerBridge'

const testDoc = makeDoc([
  makeRect({ id: 's1', name: 'S1' }),
  makeRect({ id: 's2', name: 'S2', x: 10, y: 10 }),
])

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

function setup(tool: DrawTool | undefined) {
  const { result, store } = renderHookWithStore(() => useToolPointerBridge(tool))
  store.set(documentAtom, testDoc)
  const { svg, setCapture, releaseCapture, hasCapture } = makeSvgElement()
  result.current.svgRef.current = svg
  return { store, result, svg, setCapture, releaseCapture, hasCapture }
}

function makeSvgElement() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const setCapture = vi.fn()
  const releaseCapture = vi.fn()
  const hasCapture = vi.fn().mockReturnValue(true)
  svg.setPointerCapture = setCapture
  svg.releasePointerCapture = releaseCapture
  svg.hasPointerCapture = hasCapture
  svg.getScreenCTM = vi.fn().mockReturnValue({
    inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
  })
  return { svg, setCapture, releaseCapture, hasCapture }
}

function makePointerEvent(
  overrides: Record<string, unknown> = {},
): React.PointerEvent<SVGSVGElement> {
  return {
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
    ...overrides,
  } as unknown as React.PointerEvent<SVGSVGElement>
}

function mouseEvent() {
  const preventDefault = vi.fn()
  return { event: { preventDefault } as unknown as React.MouseEvent, preventDefault }
}

describe('useToolPointerBridge', () => {
  it('returns an svgRef and handler functions', () => {
    const { result } = renderHookWithStore(() => useToolPointerBridge(makeTool()))
    const { svgRef, handlers } = result.current
    expect(svgRef).toBeDefined()
    expect(handlers.onPointerDown).toBeInstanceOf(Function)
    expect(handlers.onPointerMove).toBeInstanceOf(Function)
    expect(handlers.onPointerUp).toBeInstanceOf(Function)
    expect(handlers.onPointerCancel).toBeInstanceOf(Function)
    expect(handlers.onContextMenu).toBeInstanceOf(Function)
  })

  it('sets pointer capture on pointerdown', () => {
    const tool = makeTool()
    const { result, setCapture } = setup(tool)

    result.current.handlers.onPointerDown(makePointerEvent({ pointerId: 42 }))

    expect(setCapture).toHaveBeenCalledWith(42)
    expect(tool.onPointerDown).toHaveBeenCalled()
  })

  it('releases pointer capture on pointerup', () => {
    const tool = makeTool()
    const { result, releaseCapture } = setup(tool)

    result.current.handlers.onPointerUp(makePointerEvent({ pointerId: 42 }))

    expect(releaseCapture).toHaveBeenCalledWith(42)
    expect(tool.onPointerUp).toHaveBeenCalled()
  })

  it('releases pointer capture on pointercancel', () => {
    const tool = makeTool()
    const { result, releaseCapture } = setup(tool)

    result.current.handlers.onPointerCancel(makePointerEvent({ pointerId: 42 }))

    expect(releaseCapture).toHaveBeenCalledWith(42)
  })

  it('short-circuits pointermove when shouldHandlePointerMove returns false', () => {
    const tool = makeTool({ shouldHandlePointerMove: vi.fn().mockReturnValue(false) })
    const { result } = setup(tool)

    result.current.handlers.onPointerMove(makePointerEvent())

    expect(tool.shouldHandlePointerMove).toHaveBeenCalled()
    expect(tool.onPointerMove).not.toHaveBeenCalled()
  })

  it('forwards pointermove when shouldHandlePointerMove returns true', () => {
    const tool = makeTool({ shouldHandlePointerMove: vi.fn().mockReturnValue(true) })
    const { result } = setup(tool)

    result.current.handlers.onPointerMove(makePointerEvent())

    expect(tool.onPointerMove).toHaveBeenCalled()
  })

  it('forwards pointermove when shouldHandlePointerMove is not defined', () => {
    const tool = makeTool()
    const { result } = setup(tool)

    result.current.handlers.onPointerMove(makePointerEvent())

    expect(tool.onPointerMove).toHaveBeenCalled()
  })

  it('ignores pointerdown for non-primary button', () => {
    const tool = makeTool()
    const { result, setCapture } = setup(tool)

    result.current.handlers.onPointerDown(makePointerEvent({ button: 2 }))

    expect(setCapture).not.toHaveBeenCalled()
    expect(tool.onPointerDown).not.toHaveBeenCalled()
  })

  it('pointerdown arms marquee and captures pointer when tool is undefined', () => {
    const { result, setCapture } = setup(undefined)

    result.current.handlers.onPointerDown(makePointerEvent({ pointerId: 7 }))

    expect(setCapture).toHaveBeenCalledWith(7)
  })

  it('sub-threshold pointerup on canvas background clears the selection when no tool is active', () => {
    const { result, store } = setup(undefined)
    store.set(selectedIdsAtom, ['s1', 's2'])

    result.current.handlers.onPointerDown(makePointerEvent({ clientX: 100, clientY: 100 }))
    result.current.handlers.onPointerUp(makePointerEvent({ clientX: 101, clientY: 101 }))

    expect(store.get(selectedIdsAtom)).toEqual([])
  })

  it('sub-threshold pointerup on canvas background is a no-op when selection is already empty', () => {
    const { result, store } = setup(undefined)

    result.current.handlers.onPointerDown(makePointerEvent({ clientX: 100, clientY: 100 }))
    result.current.handlers.onPointerUp(makePointerEvent({ clientX: 101, clientY: 101 }))

    expect(store.get(selectedIdsAtom)).toEqual([])
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('sub-threshold pointerup pushes a history entry when selection is non-empty', () => {
    const { result, store } = setup(undefined)
    store.set(selectedIdsAtom, ['s1', 's2'])

    result.current.handlers.onPointerDown(makePointerEvent({ clientX: 100, clientY: 100 }))
    result.current.handlers.onPointerUp(makePointerEvent({ clientX: 101, clientY: 101 }))

    expect(store.get(undoStackAtom)).toHaveLength(1)
    expect(store.get(undoStackAtom)[0].label).toBe('Clear selection')
  })

  it('Cmd+Z after sub-threshold pointerup restores previous selection', () => {
    const { result, store } = setup(undefined)
    store.set(selectedIdsAtom, ['s1', 's2'])

    result.current.handlers.onPointerDown(makePointerEvent({ clientX: 100, clientY: 100 }))
    result.current.handlers.onPointerUp(makePointerEvent({ clientX: 101, clientY: 101 }))
    expect(store.get(selectedIdsAtom)).toEqual([])

    store.set(undoCommand)
    expect(store.get(selectedIdsAtom)).toEqual(['s1', 's2'])
  })

  it('pointerdown with non-primary button does not clear the selection', () => {
    const { result, store } = setup(undefined)
    store.set(selectedIdsAtom, ['s1'])

    result.current.handlers.onPointerDown(makePointerEvent({ button: 2 }))

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
  })

  it('pointerdown with active tool does not auto-clear the selection', () => {
    const tool = makeTool()
    const { result, store } = setup(tool)
    store.set(selectedIdsAtom, ['s1'])

    result.current.handlers.onPointerDown(makePointerEvent())

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    expect(tool.onPointerDown).toHaveBeenCalled()
  })

  it('pointermove updates marqueeDraftAtom.current during active marquee', () => {
    const { result, store } = setup(undefined)

    result.current.handlers.onPointerDown(makePointerEvent({ clientX: 0, clientY: 0 }))
    result.current.handlers.onPointerMove(makePointerEvent({ clientX: 15, clientY: 15 }))

    const draft = store.get(marqueeDraftAtom)
    expect(draft?.current).toEqual({ x: 15, y: 15 })
  })

  it('pointermove is a no-op when tool is undefined and no marquee is active', () => {
    const { result } = setup(undefined)

    expect(() => {
      result.current.handlers.onPointerMove(makePointerEvent())
    }).not.toThrow()
  })

  it('past-threshold pointerup commits selection via selectShapesCommand', () => {
    const { result, store } = setup(undefined)

    result.current.handlers.onPointerDown(makePointerEvent({ clientX: 0, clientY: 0 }))
    result.current.handlers.onPointerMove(makePointerEvent({ clientX: 12, clientY: 12 }))
    result.current.handlers.onPointerUp(makePointerEvent({ clientX: 12, clientY: 12 }))

    expect(store.get(marqueeDraftAtom)).toBe(null)
    expect(store.get(selectedIdsAtom)).toEqual(['s1', 's2'])
    expect(store.get(undoStackAtom)).toHaveLength(1)
    expect(store.get(undoStackAtom)[0].label).toBe('Select shapes')
  })

  it('Shift+pointerdown arms additive marquee with baseSelection', () => {
    const { result, store } = setup(undefined)
    store.set(selectedIdsAtom, ['s1'])

    result.current.handlers.onPointerDown(
      makePointerEvent({ clientX: 0, clientY: 0, shiftKey: true }),
    )

    const draft = store.get(marqueeDraftAtom)
    expect(draft?.additive).toBe(true)
    expect(draft?.baseSelection).toEqual(['s1'])
  })

  it('sub-threshold Shift+pointerup preserves selection (no command dispatched)', () => {
    const { result, store } = setup(undefined)
    store.set(selectedIdsAtom, ['s1'])

    result.current.handlers.onPointerDown(
      makePointerEvent({ clientX: 100, clientY: 100, shiftKey: true }),
    )
    result.current.handlers.onPointerUp(makePointerEvent({ clientX: 101, clientY: 101 }))

    expect(store.get(selectedIdsAtom)).toEqual(['s1'])
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('pointerup releases pointer capture even when tool is undefined', () => {
    const { result, releaseCapture } = setup(undefined)

    result.current.handlers.onPointerUp(makePointerEvent({ pointerId: 42 }))

    expect(releaseCapture).toHaveBeenCalledWith(42)
  })

  it('pointerup does not release pointer capture when capture is not held', () => {
    const { result, releaseCapture, hasCapture } = setup(undefined)
    hasCapture.mockReturnValue(false)

    result.current.handlers.onPointerUp(makePointerEvent({ pointerId: 42 }))

    expect(releaseCapture).not.toHaveBeenCalled()
  })

  it('pointerup releases capture even when tool.onPointerUp throws', () => {
    const tool = makeTool({
      onPointerUp: vi.fn(() => {
        throw new Error('tool exploded')
      }),
    })
    const { result, releaseCapture } = setup(tool)

    expect(() => {
      result.current.handlers.onPointerUp(makePointerEvent({ pointerId: 7 }))
    }).toThrow('tool exploded')
    expect(releaseCapture).toHaveBeenCalledWith(7)
  })

  it('contextMenu prevents default when shouldHandlePointerMove returns true', () => {
    const tool = makeTool({ shouldHandlePointerMove: vi.fn().mockReturnValue(true) })
    const { result } = renderHookWithStore(() => useToolPointerBridge(tool))
    const { event, preventDefault } = mouseEvent()

    result.current.handlers.onContextMenu(event)

    expect(preventDefault).toHaveBeenCalled()
  })

  it('contextMenu does not prevent default when tool is undefined', () => {
    const { result } = renderHookWithStore(() => useToolPointerBridge(undefined))
    const { event, preventDefault } = mouseEvent()

    result.current.handlers.onContextMenu(event)

    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('contextMenu does not prevent default when shouldHandlePointerMove returns false', () => {
    const tool = makeTool({ shouldHandlePointerMove: vi.fn().mockReturnValue(false) })
    const { result } = renderHookWithStore(() => useToolPointerBridge(tool))
    const { event, preventDefault } = mouseEvent()

    result.current.handlers.onContextMenu(event)

    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('contextMenu does not prevent default when shouldHandlePointerMove is not defined', () => {
    const tool = makeTool()
    const { result } = renderHookWithStore(() => useToolPointerBridge(tool))
    const { event, preventDefault } = mouseEvent()

    result.current.handlers.onContextMenu(event)

    expect(preventDefault).not.toHaveBeenCalled()
  })
})
