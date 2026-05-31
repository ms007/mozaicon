import { describe, expect, it } from 'vitest'

import { applyInverseMatrix } from './applyInverseMatrix'

describe('applyInverseMatrix', () => {
  it('identity matrix returns the same point', () => {
    const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
    expect(applyInverseMatrix(identity, { x: 42, y: 99 })).toEqual({ x: 42, y: 99 })
  })

  it('uniform scale (inverse of 2× is 0.5×)', () => {
    const inverseOf2x = { a: 0.5, b: 0, c: 0, d: 0.5, e: -5, f: -10 }
    const result = applyInverseMatrix(inverseOf2x, { x: 30, y: 40 })
    expect(result.x).toBeCloseTo(10)
    expect(result.y).toBeCloseTo(10)
  })

  it('non-uniform scale', () => {
    const inverseOf4x2 = { a: 0.25, b: 0, c: 0, d: 0.5, e: 0, f: 0 }
    const result = applyInverseMatrix(inverseOf4x2, { x: 20, y: 10 })
    expect(result.x).toBeCloseTo(5)
    expect(result.y).toBeCloseTo(5)
  })

  it('translation only', () => {
    const inverseTranslation = { a: 1, b: 0, c: 0, d: 1, e: -10, f: -20 }
    const result = applyInverseMatrix(inverseTranslation, { x: 15, y: 25 })
    expect(result.x).toBeCloseTo(5)
    expect(result.y).toBeCloseTo(5)
  })

  it('combined rotation and scale (45° rotation at 2× scale)', () => {
    const cos45 = Math.SQRT2 / 2
    const ctm = new DOMMatrix([2 * cos45, 2 * cos45, -2 * cos45, 2 * cos45, 0, 0])
    const inv = ctm.inverse()
    const inverse = { a: inv.a, b: inv.b, c: inv.c, d: inv.d, e: inv.e, f: inv.f }

    const result = applyInverseMatrix(inverse, { x: 2, y: 0 })
    expect(result.x).toBeCloseTo(cos45)
    expect(result.y).toBeCloseTo(-cos45)
  })
})
