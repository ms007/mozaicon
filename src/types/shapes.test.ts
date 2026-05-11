import { describe, expect, it } from 'vitest'

import { Document, RectShape, Shape } from './shapes'

const validRect = {
  id: 'r1',
  name: 'Rect 1',
  visible: true,
  locked: false,
  type: 'rect' as const,
  x: 0,
  y: 0,
  width: 10,
  height: 10,
}

describe('RectShape schema', () => {
  it('accepts a well-formed rect', () => {
    expect(RectShape.parse(validRect)).toEqual(validRect)
  })

  it('accepts optional style fields', () => {
    const styled = { ...validRect, fill: '#000', stroke: '#fff', strokeWidth: 2, rx: 1 }
    expect(RectShape.parse(styled)).toEqual(styled)
  })

  it('rejects a rect with missing required fields', () => {
    const missingWidth = {
      id: 'r1',
      name: 'Rect 1',
      visible: true,
      locked: false,
      type: 'rect',
      x: 0,
      y: 0,
      height: 10,
    }
    expect(RectShape.safeParse(missingWidth).success).toBe(false)
  })

  it('rejects a rect with wrong field types', () => {
    const bad = { ...validRect, width: '10' }
    expect(RectShape.safeParse(bad).success).toBe(false)
  })

  it('rejects a rect with the wrong discriminant', () => {
    const bad = { ...validRect, type: 'circle' }
    expect(RectShape.safeParse(bad).success).toBe(false)
  })

  it('rejects negative width', () => {
    const bad = { ...validRect, width: -1 }
    expect(RectShape.safeParse(bad).success).toBe(false)
  })

  it('rejects negative height', () => {
    const bad = { ...validRect, height: -5 }
    expect(RectShape.safeParse(bad).success).toBe(false)
  })

  it('rejects negative rx', () => {
    const bad = { ...validRect, rx: -0.5 }
    expect(RectShape.safeParse(bad).success).toBe(false)
  })

  it('accepts zero width and height (degenerate point)', () => {
    const point = { ...validRect, width: 0, height: 0 }
    expect(RectShape.safeParse(point).success).toBe(true)
  })
})

describe('Shape discriminated union', () => {
  it('accepts a rect', () => {
    expect(Shape.parse(validRect)).toEqual(validRect)
  })

  it('rejects a shape with an unknown type', () => {
    const unknown = { ...validRect, type: 'hexagon' }
    expect(Shape.safeParse(unknown).success).toBe(false)
  })

  it('rejects a shape without a discriminant', () => {
    const noType = {
      id: 'r1',
      name: 'Rect 1',
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    }
    expect(Shape.safeParse(noType).success).toBe(false)
  })
})

describe('Document schema', () => {
  it('accepts a document with an empty shapes list', () => {
    const parsed = Document.parse({
      id: 'doc-1',
      name: 'Untitled',
      viewBox: [0, 0, 24, 24],
      shapes: [],
    })
    expect(parsed.shapes).toEqual([])
    expect(parsed.viewBox).toEqual([0, 0, 24, 24])
  })

  it('applies the default viewBox of [0, 0, 24, 24]', () => {
    const parsed = Document.parse({
      id: 'doc-1',
      name: 'Untitled',
      shapes: [],
    })
    expect(parsed.viewBox).toEqual([0, 0, 24, 24])
  })

  it('accepts a document containing rect shapes', () => {
    const parsed = Document.parse({
      id: 'doc-1',
      name: 'Untitled',
      viewBox: [0, 0, 24, 24],
      shapes: [validRect],
    })
    expect(parsed.shapes).toHaveLength(1)
    expect(parsed.shapes[0]).toEqual(validRect)
  })

  it('rejects a viewBox with the wrong arity', () => {
    const bad = {
      id: 'doc-1',
      name: 'Untitled',
      viewBox: [0, 0, 24],
      shapes: [],
    }
    expect(Document.safeParse(bad).success).toBe(false)
  })

  it('rejects a document missing required fields', () => {
    expect(Document.safeParse({ name: 'x', shapes: [] }).success).toBe(false)
  })

  it('rejects a document containing an invalid shape', () => {
    const bad = {
      id: 'doc-1',
      name: 'Untitled',
      viewBox: [0, 0, 24, 24],
      shapes: [{ ...validRect, width: 'wide' }],
    }
    expect(Document.safeParse(bad).success).toBe(false)
  })
})
