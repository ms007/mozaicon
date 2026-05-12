import { describe, expect, it } from 'vitest'

import type { RectShape } from '@/types/shapes'

import { scaleShape } from './scale'

const baseRect: RectShape = {
  id: 'r1',
  type: 'rect',
  name: 'Rect',
  visible: true,
  locked: false,
  x: 4,
  y: 4,
  width: 8,
  height: 6,
}

describe('scaleShape', () => {
  it('returns the same reference when sx === 1 && sy === 1', () => {
    const result = scaleShape(baseRect, { x: 0, y: 0 }, 1, 1)
    expect(result).toBe(baseRect)
  })

  it('scales a rect from the opposite corner (positive scale)', () => {
    const anchor = { x: 4, y: 4 }
    const result = scaleShape(baseRect, anchor, 2, 3)

    expect(result).toMatchObject({
      type: 'rect',
      x: 4,
      y: 4,
      width: 16,
      height: 18,
    })
  })

  it('handles anchor at center — halves effective offset on each side', () => {
    const anchor = { x: 8, y: 7 }
    const result = scaleShape(baseRect, anchor, 0.5, 0.5)

    expect(result).toMatchObject({
      type: 'rect',
      x: 6,
      y: 5.5,
      width: 4,
      height: 3,
    })
  })

  it('flips geometry with negative sx', () => {
    const anchor = { x: 4, y: 4 }
    const result = scaleShape(baseRect, anchor, -1, 1)

    expect(result).toMatchObject({
      type: 'rect',
      x: -4,
      y: 4,
      width: 8,
      height: 6,
    })
  })

  it('flips geometry with negative sy', () => {
    const anchor = { x: 4, y: 4 }
    const result = scaleShape(baseRect, anchor, 1, -1)

    expect(result).toMatchObject({
      type: 'rect',
      x: 4,
      y: -2,
      width: 8,
      height: 6,
    })
  })

  it('flips geometry with both negative sx and sy', () => {
    const anchor = { x: 4, y: 4 }
    const result = scaleShape(baseRect, anchor, -1, -1)

    expect(result).toMatchObject({
      type: 'rect',
      x: -4,
      y: -2,
      width: 8,
      height: 6,
    })
  })

  it('preserves non-geometry properties', () => {
    const rect: RectShape = {
      ...baseRect,
      fill: '#ff0000',
      stroke: '#000',
      strokeWidth: 2,
    }
    const result = scaleShape(rect, { x: 0, y: 0 }, 2, 2)

    expect(result).toMatchObject({
      id: 'r1',
      name: 'Rect',
      visible: true,
      locked: false,
      fill: '#ff0000',
      stroke: '#000',
      strokeWidth: 2,
    })
  })

  it('scales from an arbitrary anchor point', () => {
    const anchor = { x: 12, y: 10 }
    const result = scaleShape(baseRect, anchor, 2, 2)

    expect(result).toMatchObject({
      type: 'rect',
      x: -4,
      y: -2,
      width: 16,
      height: 12,
    })
  })

  it('collapses to zero width when sx is 0', () => {
    const anchor = { x: 4, y: 4 }
    const result = scaleShape(baseRect, anchor, 0, 1)

    expect(result).toMatchObject({
      type: 'rect',
      x: 4,
      y: 4,
      width: 0,
      height: 6,
    })
  })

  it('collapses to zero height when sy is 0', () => {
    const anchor = { x: 4, y: 4 }
    const result = scaleShape(baseRect, anchor, 1, 0)

    expect(result).toMatchObject({
      type: 'rect',
      x: 4,
      y: 4,
      width: 8,
      height: 0,
    })
  })

  it('collapses to a point when both sx and sy are 0', () => {
    const anchor = { x: 4, y: 4 }
    const result = scaleShape(baseRect, anchor, 0, 0)

    expect(result).toMatchObject({
      type: 'rect',
      x: 4,
      y: 4,
      width: 0,
      height: 0,
    })
  })
})
