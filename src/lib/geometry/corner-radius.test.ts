import { describe, expect, it } from 'vitest'

import type { Radii, RectShape } from '@/types/shapes'

import { clampRadii, effectiveRadii, isUniform, roundedRectPath } from './corner-radius'

const baseRect: RectShape = {
  id: 'r1',
  type: 'rect',
  name: 'Rect',
  visible: true,
  locked: false,
  x: 0,
  y: 0,
  width: 20,
  height: 10,
}

describe('effectiveRadii', () => {
  it('returns the radii tuple when present', () => {
    expect(effectiveRadii({ ...baseRect, radii: [1, 2, 3, 4] })).toEqual([1, 2, 3, 4])
  })

  it('expands rx into a uniform tuple', () => {
    expect(effectiveRadii({ ...baseRect, rx: 5 })).toEqual([5, 5, 5, 5])
  })

  it('returns all-zero when neither rx nor radii is set', () => {
    expect(effectiveRadii(baseRect)).toEqual([0, 0, 0, 0])
  })

  it('prefers radii over rx when both are present', () => {
    expect(effectiveRadii({ ...baseRect, rx: 2, radii: [1, 2, 3, 4] })).toEqual([1, 2, 3, 4])
  })
})

describe('clampRadii', () => {
  it('returns radii unchanged when all fit', () => {
    const radii: Radii = [2, 2, 2, 2]
    expect(clampRadii(radii, 20, 20)).toEqual([2, 2, 2, 2])
  })

  it('clamps each radius to half the smaller side', () => {
    const radii: Radii = [100, 100, 100, 100]
    expect(clampRadii(radii, 10, 20)).toEqual([5, 5, 5, 5])
  })

  it('clamps to half the height when height is smaller', () => {
    const radii: Radii = [10, 10, 10, 10]
    expect(clampRadii(radii, 20, 6)).toEqual([3, 3, 3, 3])
  })

  it('clamps individually per corner', () => {
    const radii: Radii = [1, 20, 3, 20]
    expect(clampRadii(radii, 10, 10)).toEqual([1, 5, 3, 5])
  })

  it('preserves zeros', () => {
    const radii: Radii = [0, 5, 0, 5]
    expect(clampRadii(radii, 20, 20)).toEqual([0, 5, 0, 5])
  })

  it('handles zero-size rect by clamping all to 0', () => {
    const radii: Radii = [5, 5, 5, 5]
    expect(clampRadii(radii, 0, 0)).toEqual([0, 0, 0, 0])
  })

  it('floors negative values at zero', () => {
    const radii: Radii = [-5, -1, 3, -10]
    expect(clampRadii(radii, 20, 20)).toEqual([0, 0, 3, 0])
  })
})

describe('isUniform', () => {
  it('returns true when all four values are equal', () => {
    expect(isUniform([3, 3, 3, 3])).toBe(true)
  })

  it('returns true when all zeros', () => {
    expect(isUniform([0, 0, 0, 0])).toBe(true)
  })

  it('returns false when any value differs', () => {
    expect(isUniform([3, 3, 3, 4])).toBe(false)
    expect(isUniform([1, 2, 3, 4])).toBe(false)
  })
})

describe('roundedRectPath', () => {
  it('generates a rectangle path with zero radii', () => {
    const d = roundedRectPath(0, 0, 10, 8, [0, 0, 0, 0])
    expect(d).toBe('M0 0H10V8H0Z')
  })

  it('generates arcs for uniform nonzero radii', () => {
    const d = roundedRectPath(0, 0, 20, 10, [3, 3, 3, 3])
    expect(d).toContain('A3 3')
    expect(d).toMatch(/^M3 0/)
    expect(d).toMatch(/Z$/)
  })

  it('generates different arcs for each corner', () => {
    const d = roundedRectPath(0, 0, 20, 20, [1, 2, 3, 4])
    expect(d).toContain('A1 1')
    expect(d).toContain('A2 2')
    expect(d).toContain('A3 3')
    expect(d).toContain('A4 4')
  })

  it('applies position offset', () => {
    const d = roundedRectPath(5, 10, 20, 20, [2, 2, 2, 2])
    expect(d).toMatch(/^M7 10/)
  })

  it('clamps radii to half the smaller side', () => {
    const dClamped = roundedRectPath(0, 0, 10, 10, [100, 100, 100, 100])
    const dMax = roundedRectPath(0, 0, 10, 10, [5, 5, 5, 5])
    expect(dClamped).toBe(dMax)
  })

  it('omits arcs for zero-radius corners', () => {
    const d = roundedRectPath(0, 0, 20, 20, [0, 5, 0, 5])
    const arcCount = (d.match(/A/g) ?? []).length
    expect(arcCount).toBe(2)
  })
})
