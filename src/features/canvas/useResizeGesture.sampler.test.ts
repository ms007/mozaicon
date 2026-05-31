import { act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { resizeDraftAtom } from '@/store/atoms/resize-draft'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import { renderHookWithStore } from '@/test/renderWithStore'
import { seedSelection } from '@/test/seedSelection'

import { useResizeGesture } from './useResizeGesture'

const rect = makeRect({ id: 's1', x: 0, y: 0, width: 100, height: 50 })
const testDoc = makeDoc([rect])

function makeSvgRef(ctm: DOMMatrix | null = new DOMMatrix([1, 0, 0, 1, 0, 0])) {
  const svg = { getScreenCTM: () => ctm } as unknown as SVGSVGElement
  return { current: svg }
}

function pointerDown(overrides: Partial<React.PointerEvent> = {}) {
  const setPointerCapture = vi.fn()
  return {
    button: 0,
    pointerId: 1,
    clientX: 100,
    clientY: 50,
    shiftKey: false,
    altKey: false,
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(),
    currentTarget: { setPointerCapture },
    ...overrides,
  } as unknown as React.PointerEvent
}

function windowPointerEvent(type: string, overrides: Partial<PointerEvent> = {}) {
  return new PointerEvent(type, {
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    ...overrides,
  })
}

describe('useResizeGesture (sampler integration)', () => {
  function setup(ctm?: DOMMatrix | null) {
    const svgRef = makeSvgRef(ctm)
    const bbox = { x: 0, y: 0, width: 100, height: 50 }

    const { result, store } = renderHookWithStore(
      () => useResizeGesture(svgRef),
      (s) => {
        s.set(documentAtom, testDoc)
        seedSelection(s, ['s1'])
      },
    )

    function startDrag(e?: Partial<React.PointerEvent>) {
      act(() => {
        result.current.onHandlePointerDown('se', bbox, pointerDown(e))
      })
    }

    return { result, store, startDrag, svgRef }
  }

  it('creates sampler at gesture start — CTM read once', () => {
    const ctm = new DOMMatrix([2, 0, 0, 2, 10, 20])
    const { svgRef, startDrag } = setup(ctm)
    const svg = svgRef.current
    const spy = vi.spyOn(svg, 'getScreenCTM')

    startDrag()
    spy.mockClear()

    act(() => {
      window.dispatchEvent(windowPointerEvent('pointermove', { clientX: 130, clientY: 70 }))
    })

    expect(spy).not.toHaveBeenCalled()
  })

  it('frame-throttles resizeDraftAtom writes (≤1 per frame)', () => {
    vi.useFakeTimers()
    const rafCallbacks: FrameRequestCallback[] = []
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(vi.fn())

    const { startDrag, store } = setup()
    startDrag()

    act(() => {
      window.dispatchEvent(windowPointerEvent('pointermove', { clientX: 110, clientY: 55 }))
      window.dispatchEvent(windowPointerEvent('pointermove', { clientX: 120, clientY: 60 }))
      window.dispatchEvent(windowPointerEvent('pointermove', { clientX: 130, clientY: 70 }))
    })

    expect(store.get(resizeDraftAtom)).toBeNull()
    expect(rafCallbacks).toHaveLength(1)

    act(() => {
      rafCallbacks[0](performance.now())
    })

    const draft = store.get(resizeDraftAtom)
    expect(draft).not.toBeNull()
    expect(draft?.s1).toEqual({ x: 0, y: 0, width: 130, height: 70 })

    vi.useRealTimers()
  })

  it('pointerup uses synchronous sampler.toViewBox and commits', () => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1)
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(vi.fn())

    const { startDrag, store } = setup()
    startDrag()

    act(() => {
      window.dispatchEvent(windowPointerEvent('pointerup', { clientX: 150, clientY: 75 }))
    })

    expect(store.get(resizeDraftAtom)).toBeNull()

    const shapes = store.get(documentAtom).shapes
    const updated = shapes.find((s) => s.id === 's1')
    expect(updated).toMatchObject({ x: 0, y: 0, width: 150, height: 75 })

    vi.useRealTimers()
  })

  it('sampler is discarded at pointerup — no frame fires after release', () => {
    vi.useFakeTimers()
    const rafCallbacks: FrameRequestCallback[] = []
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(vi.fn())

    const { startDrag, store } = setup()
    startDrag()

    act(() => {
      window.dispatchEvent(windowPointerEvent('pointermove', { clientX: 120, clientY: 60 }))
    })

    act(() => {
      window.dispatchEvent(windowPointerEvent('pointerup', { clientX: 150, clientY: 75 }))
    })

    // The pending move frame should have been cancelled by stop()
    if (rafCallbacks.length > 0) {
      act(() => {
        rafCallbacks[0](performance.now())
      })
    }

    // Draft must be null (not the stale move value)
    expect(store.get(resizeDraftAtom)).toBeNull()

    vi.useRealTimers()
  })

  it('retains window-pointer-listener model — window pointermove drives resize', () => {
    vi.useFakeTimers()
    const rafCallbacks: FrameRequestCallback[] = []
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(vi.fn())

    const { startDrag, store } = setup()
    startDrag()

    // Dispatch on window (not on the svg element) — proves window-listener model
    act(() => {
      window.dispatchEvent(windowPointerEvent('pointermove', { clientX: 120, clientY: 60 }))
    })

    act(() => {
      rafCallbacks[0](performance.now())
    })

    expect(store.get(resizeDraftAtom)).not.toBeNull()

    vi.useRealTimers()
  })
})
