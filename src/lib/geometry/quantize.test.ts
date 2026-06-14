import { describe, expect, it } from 'vitest'

import { makeRect } from '@/test/fixtures/shapes'

import { quantizeRect, quantizeShape } from './quantize'

describe('quantizeRect', () => {
  it('rounds every field to 2 decimal places', () => {
    expect(quantizeRect({ x: 1.234, y: 5.678, width: 9.005, height: 2.001 })).toEqual({
      x: 1.23,
      y: 5.68,
      width: 9.01,
      height: 2,
    })
  })

  it('leaves already-clean values untouched', () => {
    const rect = { x: 1.25, y: 0, width: 10, height: 4.5 }
    expect(quantizeRect(rect)).toEqual(rect)
  })
})

describe('quantizeShape', () => {
  it('rounds position and dimensions, preserving other fields', () => {
    const shape = makeRect({ id: 'a', x: 1.111, y: 2.999, width: 3.005, height: 4.004 })

    const result = quantizeShape(shape)

    expect(result).toMatchObject({ id: 'a', x: 1.11, y: 3, width: 3.01, height: 4 })
    expect(result.corners).toBe(shape.corners)
  })
})
