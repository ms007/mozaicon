import type { Vec2 } from '@/lib/geometry/vec2'

import { type AffineMatrix, applyInverseMatrix } from './applyInverseMatrix'

export type GestureModifiers = {
  shift: boolean
  alt: boolean
}

export type GestureSample = {
  point: Vec2
  modifiers: GestureModifiers
}

export type FrameScheduler = {
  request(cb: FrameRequestCallback): number
  cancel(id: number): void
}

export const rafScheduler: FrameScheduler = {
  request: (cb) => requestAnimationFrame(cb),
  cancel: (id) => {
    cancelAnimationFrame(id)
  },
}

export type GestureSampler = {
  toViewBox(screenPoint: Vec2): Vec2
  schedule(
    screenPoint: Vec2,
    modifiers: GestureModifiers,
    callback: (sample: GestureSample) => void,
  ): void
  stop(): void
}

export function createGestureSampler(
  svg: SVGSVGElement,
  scheduler: FrameScheduler,
): GestureSampler {
  const ctm = svg.getScreenCTM()
  const inverse: AffineMatrix = ctm
    ? (() => {
        const inv = ctm.inverse()
        return { a: inv.a, b: inv.b, c: inv.c, d: inv.d, e: inv.e, f: inv.f }
      })()
    : { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }

  let frameId: number | null = null
  let latestScreenPoint: Vec2 | null = null
  let latestModifiers: GestureModifiers | null = null
  let latestCallback: ((sample: GestureSample) => void) | null = null

  function toViewBox(screenPoint: Vec2): Vec2 {
    return applyInverseMatrix(inverse, screenPoint)
  }

  function schedule(
    screenPoint: Vec2,
    modifiers: GestureModifiers,
    callback: (sample: GestureSample) => void,
  ): void {
    latestScreenPoint = screenPoint
    latestModifiers = modifiers
    latestCallback = callback

    if (frameId !== null) return

    frameId = scheduler.request(() => {
      frameId = null
      const sp = latestScreenPoint
      const mod = latestModifiers
      const cb = latestCallback
      latestScreenPoint = null
      latestModifiers = null
      latestCallback = null
      if (sp && mod && cb) {
        cb({ point: toViewBox(sp), modifiers: mod })
      }
    })
  }

  function stop(): void {
    if (frameId !== null) {
      scheduler.cancel(frameId)
      frameId = null
    }
    latestScreenPoint = null
    latestModifiers = null
    latestCallback = null
  }

  return { toViewBox, schedule, stop }
}
