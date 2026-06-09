import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { makeRect } from '@/test/fixtures/shapes'

import { chooseRectElement } from './rectElement'

const base = makeRect({ width: 20, height: 10 })

function withRadii(radii: [number, number, number, number]) {
  return { ...base, corners: { ...DEFAULT_CORNERS, radii } }
}

describe('chooseRectElement', () => {
  it('returns a rect tag for a plain rect', () => {
    const el = chooseRectElement(base)
    expect(el.tag).toBe('rect')
    expect(el.attrs).toEqual({ x: 0, y: 0, width: 20, height: 10, rx: undefined })
  })

  it('returns a rect tag with rx for uniform radii', () => {
    const el = chooseRectElement(withRadii([4, 4, 4, 4]))
    expect(el.tag).toBe('rect')
    expect(el.attrs).toEqual({ x: 0, y: 0, width: 20, height: 10, rx: 4 })
  })

  it('returns a path tag for non-uniform radii', () => {
    const el = chooseRectElement(withRadii([1, 2, 3, 4]))
    expect(el.tag).toBe('path')
    expect(el.attrs).toHaveProperty('d')
    const d = (el.attrs as { d: string }).d
    expect(d).toContain('A1 1')
    expect(d).toContain('A2 2')
    expect(d).toContain('A3 3')
    expect(d).toContain('A4 4')
  })

  it('returns a rect tag for all-zero radii', () => {
    const el = chooseRectElement(withRadii([0, 0, 0, 0]))
    expect(el.tag).toBe('rect')
    expect(el.attrs).toEqual({ x: 0, y: 0, width: 20, height: 10, rx: undefined })
  })

  it('ignores residual smoothing when style is rounded (uniform radii)', () => {
    const shape = {
      ...base,
      corners: {
        ...DEFAULT_CORNERS,
        radii: [4, 4, 4, 4] as [number, number, number, number],
        smoothing: 60,
      },
    }
    const el = chooseRectElement(shape)
    expect(el.tag).toBe('rect')
    expect(el.attrs).toEqual({ x: 0, y: 0, width: 20, height: 10, rx: 4 })
  })

  it('ignores residual smoothing when style is rounded (non-uniform radii)', () => {
    const shape = {
      ...base,
      corners: {
        ...DEFAULT_CORNERS,
        radii: [1, 2, 3, 4] as [number, number, number, number],
        smoothing: 60,
      },
    }
    const el = chooseRectElement(shape)
    expect(el.tag).toBe('path')
    const d = (el.attrs as { d: string }).d
    expect(d).toContain('A')
    expect(d).not.toContain('C')
  })

  it('returns a rect tag for uniform radii with smoothing 0', () => {
    const shape = {
      ...base,
      corners: {
        ...DEFAULT_CORNERS,
        radii: [4, 4, 4, 4] as [number, number, number, number],
        smoothing: 0,
      },
    }
    const el = chooseRectElement(shape)
    expect(el.tag).toBe('rect')
    expect(el.attrs).toEqual({ x: 0, y: 0, width: 20, height: 10, rx: 4 })
  })

  it('returns a path tag when style is smooth even with smoothing 0', () => {
    const shape = {
      ...base,
      corners: {
        radii: [4, 4, 4, 4] as [number, number, number, number],
        style: 'smooth' as const,
        smoothing: 0,
      },
    }
    const el = chooseRectElement(shape)
    expect(el.tag).toBe('path')
    expect(el.attrs).toHaveProperty('d')
  })

  it('returns a path tag for smooth style with smoothing > 0', () => {
    const shape = {
      ...base,
      corners: {
        radii: [4, 4, 4, 4] as [number, number, number, number],
        style: 'smooth' as const,
        smoothing: 60,
      },
    }
    const el = chooseRectElement(shape)
    expect(el.tag).toBe('path')
    const d = (el.attrs as { d: string }).d
    expect(d).toContain('C')
    expect(d).not.toContain('A')
  })
})
