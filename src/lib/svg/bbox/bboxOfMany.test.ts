import { describe, expect, it } from 'vitest'

import { makeRect } from '@/test/fixtures/shapes'

import { bboxOfMany } from './index'

describe('bboxOfMany', () => {
  it('returns null for an empty array', () => {
    expect(bboxOfMany([])).toBeNull()
  })

  it('returns the bbox of a single shape', () => {
    expect(bboxOfMany([makeRect({ x: 2, y: 3, width: 4, height: 5 })])).toEqual({
      x: 2,
      y: 3,
      width: 4,
      height: 5,
    })
  })

  it('returns the union bbox of multiple shapes', () => {
    expect(
      bboxOfMany([
        makeRect({ id: 'a', x: 0, y: 0, width: 5, height: 5 }),
        makeRect({ id: 'b', x: 3, y: 4, width: 10, height: 6 }),
      ]),
    ).toEqual({ x: 0, y: 0, width: 13, height: 10 })
  })
})
