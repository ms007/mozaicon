import { describe, expect, it } from 'vitest'

import { computeMoveDraft } from './computeMoveDraft'

describe('computeMoveDraft', () => {
  it('passes delta through unchanged when shift is false', () => {
    const result = computeMoveDraft({ x: 0, y: 0 }, { x: 7, y: 3 }, false)
    expect(result).toEqual({ dx: 7, dy: 3 })
  })

  it('zeros dy when shift is true and |dx| >= |dy| (horizontal dominant)', () => {
    const result = computeMoveDraft({ x: 0, y: 0 }, { x: 10, y: 3 }, true)
    expect(result).toEqual({ dx: 10, dy: 0 })
  })

  it('zeros dx when shift is true and |dy| > |dx| (vertical dominant)', () => {
    const result = computeMoveDraft({ x: 0, y: 0 }, { x: 3, y: 10 }, true)
    expect(result).toEqual({ dx: 0, dy: 10 })
  })

  it('uses |dx| == |dy| as horizontal (dx wins ties)', () => {
    const result = computeMoveDraft({ x: 0, y: 0 }, { x: 5, y: 5 }, true)
    expect(result).toEqual({ dx: 5, dy: 0 })
  })

  it('axis-lock decision is based on cumulative distance since startPoint, not per-frame', () => {
    const start = { x: 10, y: 10 }
    const frame1 = computeMoveDraft(start, { x: 15, y: 12 }, true)
    expect(frame1).toEqual({ dx: 5, dy: 0 })

    const frame2 = computeMoveDraft(start, { x: 18, y: 13 }, true)
    expect(frame2).toEqual({ dx: 8, dy: 0 })

    const frame3 = computeMoveDraft(start, { x: 19, y: 14 }, true)
    expect(frame3).toEqual({ dx: 9, dy: 0 })
  })

  it('handles negative deltas with shift', () => {
    const result = computeMoveDraft({ x: 10, y: 10 }, { x: 2, y: 7 }, true)
    expect(result).toEqual({ dx: -8, dy: 0 })
  })

  it('handles negative vertical dominant with shift', () => {
    const result = computeMoveDraft({ x: 10, y: 10 }, { x: 8, y: 1 }, true)
    expect(result).toEqual({ dx: 0, dy: -9 })
  })

  it('works with non-origin start point', () => {
    const result = computeMoveDraft({ x: 100, y: 200 }, { x: 107, y: 203 }, false)
    expect(result).toEqual({ dx: 7, dy: 3 })
  })

  it('returns zero delta for same point', () => {
    const result = computeMoveDraft({ x: 5, y: 5 }, { x: 5, y: 5 }, true)
    expect(result).toEqual({ dx: 0, dy: 0 })
  })
})
