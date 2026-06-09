import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'

import { documentElements, shapePaintAttrs, shapeToElement } from './shapeElement'

const base = makeRect({ width: 20, height: 10 })

function withRadii(radii: [number, number, number, number]) {
  return { ...base, corners: { ...DEFAULT_CORNERS, radii } }
}

describe('shapePaintAttrs', () => {
  it('falls back to the default fill when fill is omitted', () => {
    expect(shapePaintAttrs(base)).toEqual({ fill: '#000' })
  })

  it('keeps an explicit fill', () => {
    expect(shapePaintAttrs({ ...base, fill: '#f00' })).toEqual({ fill: '#f00' })
  })

  it('omits stroke attributes when stroke is undefined', () => {
    expect(shapePaintAttrs({ ...base, strokeWidth: 2 })).toEqual({ fill: '#000' })
  })

  it('omits stroke attributes when stroke is none', () => {
    expect(shapePaintAttrs({ ...base, stroke: 'none', strokeWidth: 2 })).toEqual({ fill: '#000' })
  })

  it('includes stroke and strokeWidth when stroked', () => {
    expect(shapePaintAttrs({ ...base, stroke: '#00f', strokeWidth: 2 })).toEqual({
      fill: '#000',
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
      fill: '#000',
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

  it('applies default fill when fill is omitted', () => {
    const el = shapeToElement(base)
    expect(el.attrs.fill).toBe('#000')
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

describe('documentElements', () => {
  it('merges geometry and paint attributes per element', () => {
    const doc = makeDoc([{ ...base, fill: '#f00', stroke: '#000', strokeWidth: 1 }])
    expect(documentElements(doc)).toEqual([
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
    const doc = makeDoc([withRadii([1, 2, 3, 4])])
    const [el] = documentElements(doc)
    expect(el.tag).toBe('path')
    expect(el.attrs).toHaveProperty('d')
    expect(el.attrs.fill).toBe('#000')
  })

  it('filters hidden shapes', () => {
    const doc = makeDoc([
      { ...base, visible: false },
      { ...base, id: 'r2', fill: '#f00' },
    ])
    const els = documentElements(doc)
    expect(els).toHaveLength(1)
    expect(els[0].attrs.fill).toBe('#f00')
  })

  it('preserves shape order', () => {
    const doc = makeDoc([
      { ...base, fill: '#aaa' },
      { ...base, id: 'r2', fill: '#bbb' },
    ])
    expect(documentElements(doc).map((el) => el.attrs.fill)).toEqual(['#aaa', '#bbb'])
  })
})
