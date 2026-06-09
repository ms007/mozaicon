import { describe, expect, it } from 'vitest'

import type { Radii } from '@/types/shapes'

import { clampRadii, clampSmoothing, isUniform, normalizeCorners } from './corner-radius'

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

describe('clampSmoothing', () => {
  it('passes values within 0–100 through unchanged', () => {
    expect(clampSmoothing(0)).toBe(0)
    expect(clampSmoothing(60)).toBe(60)
    expect(clampSmoothing(100)).toBe(100)
  })

  it('clamps out-of-range values to the 0–100 bounds', () => {
    expect(clampSmoothing(-10)).toBe(0)
    expect(clampSmoothing(200)).toBe(100)
  })

  it('falls back to 0 for non-finite values', () => {
    expect(clampSmoothing(NaN)).toBe(0)
    expect(clampSmoothing(Infinity)).toBe(0)
  })
})

describe('normalizeCorners', () => {
  it('clamps radii to half the smaller side and smoothing to 0–100', () => {
    expect(
      normalizeCorners({ radii: [100, 100, 100, 100], style: 'smooth', smoothing: 500 }, 10, 10),
    ).toEqual({ radii: [5, 5, 5, 5], style: 'smooth', smoothing: 100 })
  })

  it('preserves the style and leaves valid values untouched', () => {
    expect(
      normalizeCorners({ radii: [2, 0, 4, 0], style: 'rounded', smoothing: 30 }, 20, 20),
    ).toEqual({ radii: [2, 0, 4, 0], style: 'rounded', smoothing: 30 })
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
