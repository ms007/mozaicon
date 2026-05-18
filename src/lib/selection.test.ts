import { describe, expect, it } from 'vitest'

import { isSelectable, symmetricDifference, union } from './selection'

describe('isSelectable', () => {
  it('returns true when visible and not locked', () => {
    expect(isSelectable({ visible: true, locked: false })).toBe(true)
  })

  it('returns false when locked', () => {
    expect(isSelectable({ visible: true, locked: true })).toBe(false)
  })

  it('returns false when hidden', () => {
    expect(isSelectable({ visible: false, locked: false })).toBe(false)
  })

  it('returns false when both hidden and locked', () => {
    expect(isSelectable({ visible: false, locked: true })).toBe(false)
  })
})

describe('symmetricDifference', () => {
  it('returns empty when both inputs are empty', () => {
    expect(symmetricDifference([], [])).toEqual([])
  })

  it('returns b when a is empty', () => {
    expect(symmetricDifference([], ['x', 'y'])).toEqual(['x', 'y'])
  })

  it('returns a when b is empty', () => {
    expect(symmetricDifference(['x', 'y'], [])).toEqual(['x', 'y'])
  })

  it('returns all elements when inputs are fully disjoint', () => {
    expect(symmetricDifference(['a', 'b'], ['c', 'd'])).toEqual(['a', 'b', 'c', 'd'])
  })

  it('returns empty when inputs fully overlap', () => {
    expect(symmetricDifference(['a', 'b'], ['a', 'b'])).toEqual([])
  })

  it('returns only non-shared elements on partial overlap', () => {
    expect(symmetricDifference(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['a', 'd'])
  })

  it('deduplicates within each input', () => {
    expect(symmetricDifference(['a', 'a', 'b'], ['c', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('preserves order: a-elements first, then b-elements', () => {
    expect(symmetricDifference(['z', 'a'], ['m', 'b'])).toEqual(['z', 'a', 'm', 'b'])
  })
})

describe('union', () => {
  it('returns empty when both inputs are empty', () => {
    expect(union([], [])).toEqual([])
  })

  it('returns b when a is empty', () => {
    expect(union([], ['x', 'y'])).toEqual(['x', 'y'])
  })

  it('returns a when b is empty', () => {
    expect(union(['x', 'y'], [])).toEqual(['x', 'y'])
  })

  it('returns all elements when inputs are fully disjoint', () => {
    expect(union(['a', 'b'], ['c', 'd'])).toEqual(['a', 'b', 'c', 'd'])
  })

  it('returns deduplicated list when inputs fully overlap', () => {
    expect(union(['a', 'b'], ['a', 'b'])).toEqual(['a', 'b'])
  })

  it('merges partial overlap without duplicates', () => {
    expect(union(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['a', 'b', 'c', 'd'])
  })

  it('deduplicates within each input', () => {
    expect(union(['a', 'a', 'b'], ['b', 'c', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('preserves order: a-elements first, then new b-elements', () => {
    expect(union(['z', 'a'], ['m', 'z'])).toEqual(['z', 'a', 'm'])
  })
})
