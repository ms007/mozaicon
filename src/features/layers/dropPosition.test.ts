import { describe, expect, it } from 'vitest'

import { computeBeforeId, computeDropIndicatorIndex } from './dropPosition'

// Layer IDs in panel order (top = front, bottom = back):
//   [D, C, B, A]
// Shapes array order (z-order):
//   [A, B, C, D]
const layers = ['D', 'C', 'B', 'A']

describe('computeBeforeId', () => {
  it('returns null when active or over id not in list', () => {
    expect(computeBeforeId(layers, 'X', 'C')).toBeNull()
    expect(computeBeforeId(layers, 'D', 'X')).toBeNull()
  })

  it('returns null when active equals over', () => {
    expect(computeBeforeId(layers, 'D', 'D')).toBeNull()
  })

  it('returns null for an empty list', () => {
    expect(computeBeforeId([], 'A', 'B')).toBeNull()
  })

  it('dragging top item (D) down to B → beforeId = B', () => {
    expect(computeBeforeId(layers, 'D', 'B')).toBe('B')
  })

  it('dragging bottom item (A) up to C → beforeId = D', () => {
    expect(computeBeforeId(layers, 'A', 'C')).toBe('D')
  })

  it('dragging bottom item (A) up to top item (D) → beforeId = null (bring to front)', () => {
    expect(computeBeforeId(layers, 'A', 'D')).toBeNull()
  })

  it('dragging D down to A (last) → beforeId = A (send to back)', () => {
    expect(computeBeforeId(layers, 'D', 'A')).toBe('A')
  })

  it('dragging C down one step to B', () => {
    expect(computeBeforeId(layers, 'C', 'B')).toBe('B')
  })

  it('dragging B up one step to C', () => {
    expect(computeBeforeId(layers, 'B', 'C')).toBe('D')
  })

  it('two-element list: swap', () => {
    expect(computeBeforeId(['X', 'Y'], 'X', 'Y')).toBe('Y')
    expect(computeBeforeId(['X', 'Y'], 'Y', 'X')).toBeNull()
  })
})

describe('computeDropIndicatorIndex', () => {
  it('returns null when active equals over', () => {
    expect(computeDropIndicatorIndex(layers, 'D', 'D')).toBeNull()
  })

  it('returns null for unknown ids', () => {
    expect(computeDropIndicatorIndex(layers, 'X', 'C')).toBeNull()
  })

  it('moving down: indicator below over item', () => {
    expect(computeDropIndicatorIndex(layers, 'D', 'B')).toBe(3)
  })

  it('moving up: indicator above over item', () => {
    expect(computeDropIndicatorIndex(layers, 'A', 'C')).toBe(1)
  })

  it('moving to top: indicator at index 0', () => {
    expect(computeDropIndicatorIndex(layers, 'A', 'D')).toBe(0)
  })

  it('moving to bottom: indicator at length', () => {
    expect(computeDropIndicatorIndex(layers, 'D', 'A')).toBe(4)
  })

  it('returns null for an empty list', () => {
    expect(computeDropIndicatorIndex([], 'A', 'B')).toBeNull()
  })
})
