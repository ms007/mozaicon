import { describe, expect, it } from 'vitest'

import { DRAG_THRESHOLD_PX, screenDistance } from './distance'

describe('screenDistance', () => {
  it('returns 0 for identical points', () => {
    expect(screenDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0)
  })

  it('computes horizontal distance', () => {
    expect(screenDistance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3)
  })

  it('computes vertical distance', () => {
    expect(screenDistance({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4)
  })

  it('computes diagonal distance (3-4-5 triangle)', () => {
    expect(screenDistance({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(5)
  })

  it('is symmetric', () => {
    const a = { x: 2, y: 7 }
    const b = { x: 9, y: 3 }
    expect(screenDistance(a, b)).toBe(screenDistance(b, a))
  })

  it('handles negative coordinates', () => {
    expect(screenDistance({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5)
  })
})

describe('DRAG_THRESHOLD_PX', () => {
  it('equals 3', () => {
    expect(DRAG_THRESHOLD_PX).toBe(3)
  })
})
