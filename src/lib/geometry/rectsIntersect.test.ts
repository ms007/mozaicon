import { describe, expect, it } from 'vitest'

import { rectsIntersect } from './rectsIntersect'

describe('rectsIntersect', () => {
  it('returns false for disjoint rects (horizontal gap)', () => {
    expect(
      rectsIntersect({ x: 0, y: 0, width: 5, height: 5 }, { x: 10, y: 0, width: 5, height: 5 }),
    ).toBe(false)
  })

  it('returns false for disjoint rects (vertical gap)', () => {
    expect(
      rectsIntersect({ x: 0, y: 0, width: 5, height: 5 }, { x: 0, y: 10, width: 5, height: 5 }),
    ).toBe(false)
  })

  it('returns true for edge-touching rects (horizontal)', () => {
    expect(
      rectsIntersect({ x: 0, y: 0, width: 5, height: 5 }, { x: 5, y: 0, width: 5, height: 5 }),
    ).toBe(true)
  })

  it('returns true for edge-touching rects (vertical)', () => {
    expect(
      rectsIntersect({ x: 0, y: 0, width: 5, height: 5 }, { x: 0, y: 5, width: 5, height: 5 }),
    ).toBe(true)
  })

  it('returns true when one rect is inside the other', () => {
    expect(
      rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 2, y: 2, width: 3, height: 3 }),
    ).toBe(true)
  })

  it('returns true for identical rects', () => {
    expect(
      rectsIntersect({ x: 1, y: 1, width: 4, height: 4 }, { x: 1, y: 1, width: 4, height: 4 }),
    ).toBe(true)
  })

  it('returns true for zero-width rect on edge', () => {
    expect(
      rectsIntersect({ x: 5, y: 0, width: 0, height: 5 }, { x: 0, y: 0, width: 5, height: 5 }),
    ).toBe(true)
  })

  it('returns true for zero-height rect on edge', () => {
    expect(
      rectsIntersect({ x: 0, y: 5, width: 5, height: 0 }, { x: 0, y: 0, width: 5, height: 5 }),
    ).toBe(true)
  })

  it('returns true for zero-area (point) rect inside another', () => {
    expect(
      rectsIntersect({ x: 3, y: 3, width: 0, height: 0 }, { x: 0, y: 0, width: 5, height: 5 }),
    ).toBe(true)
  })

  it('returns false for zero-area rect outside', () => {
    expect(
      rectsIntersect({ x: 6, y: 6, width: 0, height: 0 }, { x: 0, y: 0, width: 5, height: 5 }),
    ).toBe(false)
  })

  it('is commutative', () => {
    const a = { x: 0, y: 0, width: 5, height: 5 }
    const b = { x: 3, y: 3, width: 5, height: 5 }
    expect(rectsIntersect(a, b)).toBe(rectsIntersect(b, a))
  })
})
