import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { makeIcon, makeRect } from '@/test/fixtures/shapes'

import { iconElements, shapePaintAttrs, shapeToElement } from './shapeElement'

const base = makeRect({ width: 20, height: 10 })

function withRadii(radii: [number, number, number, number]) {
  return { ...base, corners: { ...DEFAULT_CORNERS, radii } }
}

describe('shapePaintAttrs', () => {
  it('treats a missing fill as none', () => {
    expect(shapePaintAttrs(base)).toEqual({ fill: 'none' })
  })

  it('keeps an explicit fill', () => {
    expect(shapePaintAttrs({ ...base, fill: '#f00' })).toEqual({ fill: '#f00' })
  })

  it('omits stroke attributes when stroke is undefined', () => {
    expect(shapePaintAttrs({ ...base, strokeWidth: 2 })).toEqual({ fill: 'none' })
  })

  it('omits stroke attributes when stroke is none', () => {
    expect(shapePaintAttrs({ ...base, stroke: 'none', strokeWidth: 2 })).toEqual({ fill: 'none' })
  })

  it('includes stroke and strokeWidth when stroked', () => {
    expect(shapePaintAttrs({ ...base, stroke: '#00f', strokeWidth: 2 })).toEqual({
      fill: 'none',
      stroke: '#00f',
      strokeWidth: 2,
    })
  })
})

describe('shapeToElement', () => {
  it('returns a rect tag for a plain rect', () => {
    const el = shapeToElement(base)
    expect(el.tag).toBe('rect')
    expect(el.attrs).toEqual({
      x: 0,
      y: 0,
      width: 20,
      height: 10,
      rx: undefined,
      fill: 'none',
    })
  })

  it('returns a rect tag with rx for uniform radii', () => {
    const el = shapeToElement(withRadii([4, 4, 4, 4]))
    expect(el.tag).toBe('rect')
    expect(el.attrs).toMatchObject({ rx: 4 })
  })

  it('returns a path tag for non-uniform radii', () => {
    const el = shapeToElement(withRadii([1, 2, 3, 4]))
    expect(el.tag).toBe('path')
    expect(el.attrs).toHaveProperty('d')
    expect(el.attrs).not.toHaveProperty('x')
  })

  it('renders a missing fill as none', () => {
    const el = shapeToElement(base)
    expect(el.attrs.fill).toBe('none')
  })

  it('keeps an explicit fill', () => {
    const el = shapeToElement({ ...base, fill: '#f00' })
    expect(el.attrs.fill).toBe('#f00')
  })

  it('omits stroke when stroke is undefined', () => {
    const el = shapeToElement({ ...base, strokeWidth: 2 })
    expect(el.attrs).not.toHaveProperty('stroke')
    expect(el.attrs).not.toHaveProperty('strokeWidth')
  })

  it('omits stroke when stroke is "none"', () => {
    const el = shapeToElement({ ...base, stroke: 'none', strokeWidth: 2 })
    expect(el.attrs).not.toHaveProperty('stroke')
    expect(el.attrs).not.toHaveProperty('strokeWidth')
  })

  it('includes stroke and strokeWidth when stroked', () => {
    const el = shapeToElement({ ...base, stroke: '#00f', strokeWidth: 2 })
    expect(el.attrs).toMatchObject({ stroke: '#00f', strokeWidth: 2 })
  })

  it('applies paint attrs to path elements too', () => {
    const el = shapeToElement({
      ...withRadii([1, 2, 3, 4]),
      fill: '#f00',
      stroke: '#0f0',
      strokeWidth: 1,
    })
    expect(el.tag).toBe('path')
    expect(el.attrs.fill).toBe('#f00')
    expect(el.attrs).toMatchObject({ stroke: '#0f0', strokeWidth: 1 })
  })
})

describe('iconElements', () => {
  it('merges geometry and paint attributes per element', () => {
    const doc = makeIcon([{ ...base, fill: '#f00', stroke: '#000', strokeWidth: 1 }])
    expect(iconElements(doc)).toEqual([
      {
        tag: 'rect',
        attrs: {
          x: 0,
          y: 0,
          width: 20,
          height: 10,
          rx: undefined,
          fill: '#f00',
          stroke: '#000',
          strokeWidth: 1,
        },
      },
    ])
  })

  it('emits a path element for non-uniform radii', () => {
    const doc = makeIcon([withRadii([1, 2, 3, 4])])
    const [el] = iconElements(doc)
    expect(el.tag).toBe('path')
    expect(el.attrs).toHaveProperty('d')
    expect(el.attrs.fill).toBe('none')
  })

  it('filters hidden shapes', () => {
    const doc = makeIcon([
      { ...base, visible: false },
      { ...base, id: 'r2', fill: '#f00' },
    ])
    const els = iconElements(doc)
    expect(els).toHaveLength(1)
    expect(els[0].attrs.fill).toBe('#f00')
  })

  it('preserves shape order', () => {
    const doc = makeIcon([
      { ...base, fill: '#aaa' },
      { ...base, id: 'r2', fill: '#bbb' },
    ])
    expect(iconElements(doc).map((el) => el.attrs.fill)).toEqual(['#aaa', '#bbb'])
  })
})
