import { describe, expect, it } from 'vitest'

import type { Rect } from './rect'
import { rectEqual, translateRect, unionRects } from './rect'

describe('unionRects', () => {
  it('returns null for empty input', () => {
    expect(unionRects([])).toBeNull()
  })

  it('returns a rect equal to the single input', () => {
    const r: Rect = { x: 10, y: 20, width: 30, height: 40 }
    expect(unionRects([r])).toEqual({ x: 10, y: 20, width: 30, height: 40 })
  })

  it('returns the smallest enclosing rect for disjoint rects', () => {
    const a: Rect = { x: 0, y: 0, width: 10, height: 10 }
    const b: Rect = { x: 20, y: 30, width: 5, height: 5 }
    expect(unionRects([a, b])).toEqual({ x: 0, y: 0, width: 25, height: 35 })
  })

  it('returns the smallest enclosing rect for overlapping rects', () => {
    const a: Rect = { x: 0, y: 0, width: 20, height: 20 }
    const b: Rect = { x: 10, y: 10, width: 20, height: 20 }
    expect(unionRects([a, b])).toEqual({ x: 0, y: 0, width: 30, height: 30 })
  })

  it('handles zero-width rects without collapsing', () => {
    const a: Rect = { x: 5, y: 5, width: 0, height: 10 }
    const b: Rect = { x: 15, y: 5, width: 10, height: 10 }
    expect(unionRects([a, b])).toEqual({ x: 5, y: 5, width: 20, height: 10 })
  })

  it('handles zero-height rects without collapsing', () => {
    const a: Rect = { x: 0, y: 0, width: 10, height: 0 }
    const b: Rect = { x: 0, y: 20, width: 10, height: 5 }
    expect(unionRects([a, b])).toEqual({ x: 0, y: 0, width: 10, height: 25 })
  })

  it('handles negative coordinates', () => {
    const a: Rect = { x: -10, y: -10, width: 5, height: 5 }
    const b: Rect = { x: 5, y: 5, width: 5, height: 5 }
    expect(unionRects([a, b])).toEqual({ x: -10, y: -10, width: 20, height: 20 })
  })

  it('encloses a fully contained rect without expanding', () => {
    const outer: Rect = { x: 0, y: 0, width: 100, height: 100 }
    const inner: Rect = { x: 10, y: 10, width: 20, height: 20 }
    expect(unionRects([outer, inner])).toEqual(outer)
  })

  it('handles more than two rects', () => {
    const a: Rect = { x: 0, y: 0, width: 10, height: 10 }
    const b: Rect = { x: 50, y: 0, width: 10, height: 10 }
    const c: Rect = { x: 0, y: 50, width: 10, height: 10 }
    expect(unionRects([a, b, c])).toEqual({ x: 0, y: 0, width: 60, height: 60 })
  })

  it('returns a new object, not a reference to the input', () => {
    const r: Rect = { x: 1, y: 2, width: 3, height: 4 }
    const result = unionRects([r])
    expect(result).not.toBe(r)
    expect(result).toEqual(r)
  })
})

describe('translateRect', () => {
  it('shifts x and y, preserving width and height', () => {
    const r: Rect = { x: 1, y: 2, width: 3, height: 4 }
    expect(translateRect(r, 10, 20)).toEqual({ x: 11, y: 22, width: 3, height: 4 })
  })

  it('handles negative offsets', () => {
    const r: Rect = { x: 5, y: 5, width: 10, height: 10 }
    expect(translateRect(r, -3, -7)).toEqual({ x: 2, y: -2, width: 10, height: 10 })
  })

  it('returns a new object, not a reference to the input', () => {
    const r: Rect = { x: 1, y: 2, width: 3, height: 4 }
    const result = translateRect(r, 0, 0)
    expect(result).not.toBe(r)
    expect(result).toEqual(r)
  })
})

describe('rectEqual', () => {
  it('treats two nulls as equal', () => {
    expect(rectEqual(null, null)).toBe(true)
  })

  it('treats null and a rect as not equal', () => {
    const r: Rect = { x: 0, y: 0, width: 1, height: 1 }
    expect(rectEqual(null, r)).toBe(false)
    expect(rectEqual(r, null)).toBe(false)
  })

  it('treats rects with identical fields as equal', () => {
    const a: Rect = { x: 1, y: 2, width: 3, height: 4 }
    const b: Rect = { x: 1, y: 2, width: 3, height: 4 }
    expect(rectEqual(a, b)).toBe(true)
  })

  it('treats rects differing in any field as not equal', () => {
    const base: Rect = { x: 1, y: 2, width: 3, height: 4 }
    expect(rectEqual(base, { ...base, x: 9 })).toBe(false)
    expect(rectEqual(base, { ...base, y: 9 })).toBe(false)
    expect(rectEqual(base, { ...base, width: 9 })).toBe(false)
    expect(rectEqual(base, { ...base, height: 9 })).toBe(false)
  })
})
