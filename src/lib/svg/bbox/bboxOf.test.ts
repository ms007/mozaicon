import { describe, expect, it } from 'vitest'

import { makeRect } from '@/test/fixtures/shapes'

import { bboxOf } from './index'

describe('bboxOf', () => {
  it('dispatches to bboxOfRect for a rect shape', () => {
    expect(bboxOf(makeRect({ x: 5, y: 10, width: 20, height: 15 }))).toEqual({
      x: 5,
      y: 10,
      width: 20,
      height: 15,
    })
  })

  it('preserves negative coordinates in the bbox', () => {
    expect(bboxOf(makeRect({ x: -8, y: -3, width: 4, height: 6 }))).toEqual({
      x: -8,
      y: -3,
      width: 4,
      height: 6,
    })
  })
})
