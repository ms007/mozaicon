import { describe, expect, it, vi } from 'vitest'

import { createGestureSampler } from './gestureSampler'

function makeFakeSvg(ctm: DOMMatrix): SVGSVGElement {
  return {
    getScreenCTM: () => ctm,
  } as unknown as SVGSVGElement
}

function makeManualScheduler() {
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

describe('createGestureSampler', () => {
  const identity = new DOMMatrix([1, 0, 0, 1, 0, 0])
  const scale2x = new DOMMatrix([2, 0, 0, 2, 10, 20])

  describe('creation and toViewBox', () => {
    it('caches inverse CTM at creation and converts coordinates without DOM read', () => {
      const svg = makeFakeSvg(scale2x)
      const scheduler = makeManualScheduler()
      const sampler = createGestureSampler(svg, scheduler)

      // After creation, getScreenCTM should not be called again
      const spy = vi.spyOn(svg, 'getScreenCTM')
      const result = sampler.toViewBox({ x: 30, y: 40 })
      expect(spy).not.toHaveBeenCalled()

      // Inverse of scale2x: (30-10)/2=10, (40-20)/2=10
      expect(result.x).toBeCloseTo(10)
      expect(result.y).toBeCloseTo(10)
    })

    it('returns identity-like result when CTM is identity', () => {
      const svg = makeFakeSvg(identity)
      const scheduler = makeManualScheduler()
      const sampler = createGestureSampler(svg, scheduler)

      const result = sampler.toViewBox({ x: 42, y: 99 })
      expect(result).toEqual({ x: 42, y: 99 })
    })

    it('falls back to identity when getScreenCTM returns null', () => {
      const svg = { getScreenCTM: () => null } as unknown as SVGSVGElement
      const scheduler = makeManualScheduler()
      const sampler = createGestureSampler(svg, scheduler)

      expect(sampler.toViewBox({ x: 7, y: 13 })).toEqual({ x: 7, y: 13 })
    })
  })

  describe('scheduling and coalescing', () => {
    it('delivers exactly one callback per frame with the latest sample', () => {
      const svg = makeFakeSvg(identity)
      const scheduler = makeManualScheduler()
      const sampler = createGestureSampler(svg, scheduler)
      const callback = vi.fn()

      sampler.schedule({ x: 10, y: 20 }, { shift: false, alt: false }, callback)
      sampler.schedule({ x: 30, y: 40 }, { shift: false, alt: false }, callback)
      sampler.schedule({ x: 50, y: 60 }, { shift: true, alt: false }, callback)

      expect(callback).not.toHaveBeenCalled()
      scheduler.flush()

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({
        point: { x: 50, y: 60 },
        modifiers: { shift: true, alt: false },
      })
    })

    it('converts screen coordinates to viewBox in delivered sample', () => {
      const svg = makeFakeSvg(scale2x)
      const scheduler = makeManualScheduler()
      const sampler = createGestureSampler(svg, scheduler)
      const callback = vi.fn()

      sampler.schedule({ x: 30, y: 40 }, { shift: false, alt: true }, callback)
      scheduler.flush()

      expect(callback).toHaveBeenCalledWith({
        point: { x: 10, y: 10 },
        modifiers: { shift: false, alt: true },
      })
    })

    it('schedules a new frame after the previous one was delivered', () => {
      const svg = makeFakeSvg(identity)
      const scheduler = makeManualScheduler()
      const sampler = createGestureSampler(svg, scheduler)
      const callback = vi.fn()

      sampler.schedule({ x: 1, y: 2 }, { shift: false, alt: false }, callback)
      scheduler.flush()

      sampler.schedule({ x: 3, y: 4 }, { shift: true, alt: true }, callback)
      scheduler.flush()

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenLastCalledWith({
        point: { x: 3, y: 4 },
        modifiers: { shift: true, alt: true },
      })
    })

    it('does not request a frame if one is already pending', () => {
      const svg = makeFakeSvg(identity)
      const scheduler = makeManualScheduler()
      const requestSpy = vi.spyOn(scheduler, 'request')
      const sampler = createGestureSampler(svg, scheduler)
      const callback = vi.fn()

      sampler.schedule({ x: 1, y: 2 }, { shift: false, alt: false }, callback)
      sampler.schedule({ x: 3, y: 4 }, { shift: false, alt: false }, callback)
      sampler.schedule({ x: 5, y: 6 }, { shift: false, alt: false }, callback)

      expect(requestSpy).toHaveBeenCalledTimes(1)
    })

    it('does not clobber a re-entrant schedule from inside the callback', () => {
      const svg = makeFakeSvg(identity)
      const scheduler = makeManualScheduler()
      const sampler = createGestureSampler(svg, scheduler)
      const outerCallback = vi.fn()

      sampler.schedule({ x: 1, y: 2 }, { shift: false, alt: false }, () => {
        sampler.schedule({ x: 99, y: 100 }, { shift: true, alt: true }, outerCallback)
      })
      scheduler.flush()
      scheduler.flush()

      expect(outerCallback).toHaveBeenCalledTimes(1)
      expect(outerCallback).toHaveBeenCalledWith({
        point: { x: 99, y: 100 },
        modifiers: { shift: true, alt: true },
      })
    })
  })

  describe('stop', () => {
    it('cancels a pending frame delivery', () => {
      const svg = makeFakeSvg(identity)
      const scheduler = makeManualScheduler()
      const sampler = createGestureSampler(svg, scheduler)
      const callback = vi.fn()

      sampler.schedule({ x: 10, y: 20 }, { shift: false, alt: false }, callback)
      expect(scheduler.hasPending).toBe(true)

      sampler.stop()
      scheduler.flush()

      expect(callback).not.toHaveBeenCalled()
    })

    it('is safe to call when no frame is pending', () => {
      const svg = makeFakeSvg(identity)
      const scheduler = makeManualScheduler()
      const sampler = createGestureSampler(svg, scheduler)

      expect(() => {
        sampler.stop()
      }).not.toThrow()
    })

    it('allows scheduling again after stop', () => {
      const svg = makeFakeSvg(identity)
      const scheduler = makeManualScheduler()
      const sampler = createGestureSampler(svg, scheduler)
      const callback = vi.fn()

      sampler.schedule({ x: 1, y: 2 }, { shift: false, alt: false }, callback)
      sampler.stop()

      sampler.schedule({ x: 7, y: 8 }, { shift: true, alt: false }, callback)
      scheduler.flush()

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({
        point: { x: 7, y: 8 },
        modifiers: { shift: true, alt: false },
      })
    })
  })
})
