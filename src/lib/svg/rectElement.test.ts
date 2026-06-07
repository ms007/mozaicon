import { describe, expect, it } from 'vitest'

import { makeRect } from '@/test/fixtures/shapes'

import { chooseRectElement } from './rectElement'

const base = makeRect({ width: 20, height: 10 })

describe('chooseRectElement', () => {
  it('returns a rect tag for a plain rect', () => {
    const el = chooseRectElement(base)
    expect(el.tag).toBe('rect')
    expect(el.attrs).toEqual({ x: 0, y: 0, width: 20, height: 10, rx: undefined })
  })

  it('returns a rect tag with rx for legacy rx field', () => {
    const el = chooseRectElement({ ...base, rx: 3 })
    expect(el.tag).toBe('rect')
    expect(el.attrs).toEqual({ x: 0, y: 0, width: 20, height: 10, rx: 3 })
  })

  it('returns a rect tag with rx for uniform radii', () => {
    const el = chooseRectElement({ ...base, radii: [4, 4, 4, 4] })
    expect(el.tag).toBe('rect')
    expect(el.attrs).toEqual({ x: 0, y: 0, width: 20, height: 10, rx: 4 })
  })

  it('returns a path tag for non-uniform radii', () => {
    const el = chooseRectElement({ ...base, radii: [1, 2, 3, 4] })
    expect(el.tag).toBe('path')
    expect(el.attrs).toHaveProperty('d')
    const d = (el.attrs as { d: string }).d
    expect(d).toContain('A1 1')
    expect(d).toContain('A2 2')
    expect(d).toContain('A3 3')
    expect(d).toContain('A4 4')
  })

  it('prefers radii over rx when both are set', () => {
    const el = chooseRectElement({ ...base, rx: 3, radii: [5, 5, 5, 5] })
    expect(el.tag).toBe('rect')
    expect(el.attrs).toEqual({ x: 0, y: 0, width: 20, height: 10, rx: 5 })
  })

  it('returns a rect tag for all-zero radii', () => {
    const el = chooseRectElement({ ...base, radii: [0, 0, 0, 0] })
    expect(el.tag).toBe('rect')
    expect(el.attrs).toEqual({ x: 0, y: 0, width: 20, height: 10, rx: 0 })
  })
})
