import { describe, expect, it } from 'vitest'

import { makeRect } from '@/test/fixtures/shapes'

import { bboxOfRect } from './rect'

describe('bboxOfRect', () => {
  it('returns the geometric bbox of a typical rect', () => {
    expect(bboxOfRect(makeRect({ x: 2, y: 3, width: 10, height: 5 }))).toEqual({
      x: 2,
      y: 3,
      width: 10,
      height: 5,
    })
  })

  it('handles a zero-size rect', () => {
    expect(bboxOfRect(makeRect({ x: 4, y: 7, width: 0, height: 0 }))).toEqual({
      x: 4,
      y: 7,
      width: 0,
      height: 0,
    })
  })

  it('ignores rx (border radius does not affect bbox)', () => {
    expect(bboxOfRect(makeRect({ x: 1, y: 1, width: 8, height: 6, rx: 3 }))).toEqual({
      x: 1,
      y: 1,
      width: 8,
      height: 6,
    })
  })
})
