import { describe, expect, it } from 'vitest'

import { makeDoc, makeRect } from '@/test/fixtures/shapes'

import { normalizeSelection } from './selection'

const doc = makeDoc([
  makeRect({ id: 'a', name: 'A', width: 5, height: 5 }),
  makeRect({ id: 'b', name: 'B', x: 5, y: 5, width: 5, height: 5 }),
  makeRect({ id: 'c', name: 'C', x: 10, y: 10, width: 5, height: 5 }),
])

describe('normalizeSelection', () => {
  it('returns ids in document z-order', () => {
    expect(normalizeSelection(['c', 'a'], doc)).toEqual(['a', 'c'])
  })

  it('deduplicates repeated ids', () => {
    expect(normalizeSelection(['a', 'a', 'b'], doc)).toEqual(['a', 'b'])
  })

  it('drops ids not present in the document', () => {
    expect(normalizeSelection(['a', 'nonexistent', 'b'], doc)).toEqual(['a', 'b'])
  })

  it('handles all three at once: dedup, z-order, stale removal', () => {
    expect(normalizeSelection(['c', 'gone', 'a', 'c', 'a'], doc)).toEqual(['a', 'c'])
  })

  it('returns empty array for all-stale ids', () => {
    expect(normalizeSelection(['x', 'y'], doc)).toEqual([])
  })

  it('returns empty array for empty input', () => {
    expect(normalizeSelection([], doc)).toEqual([])
  })

  it('preserves single id when valid', () => {
    expect(normalizeSelection(['b'], doc)).toEqual(['b'])
  })

  it('handles document with no shapes', () => {
    expect(normalizeSelection(['a'], makeDoc())).toEqual([])
  })
})
