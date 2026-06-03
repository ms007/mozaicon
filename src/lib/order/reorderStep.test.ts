import { describe, expect, it } from 'vitest'

import type { RectShape } from '@/types/shapes'

import { reorderStep } from './reorderStep'

function makeRect(id: string, overrides: Partial<RectShape> = {}): RectShape {
  return {
    type: 'rect',
    id,
    name: id,
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    ...overrides,
  }
}

function ids(shapes: readonly { id: string }[]): string[] {
  return shapes.map((s) => s.id)
}

describe('reorderStep — bringForward (direction: forward)', () => {
  it('moves a single selected shape one step toward the front', () => {
    const shapes = [makeRect('a'), makeRect('b'), makeRect('c')]
    const result = reorderStep(shapes, ['b'], 'forward')

    expect(result.changed).toBe(true)
    expect(ids(result.shapes)).toEqual(['a', 'c', 'b'])
  })

  it('is a no-op when the shape is already frontmost', () => {
    const shapes = [makeRect('a'), makeRect('b'), makeRect('c')]
    const result = reorderStep(shapes, ['c'], 'forward')

    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('moves non-contiguous selection per-neighbor without collapsing', () => {
    // a b c d — select a and c
    const shapes = [makeRect('a'), makeRect('b'), makeRect('c'), makeRect('d')]
    const result = reorderStep(shapes, ['a', 'c'], 'forward')

    expect(result.changed).toBe(true)
    // a swaps with b, c swaps with d
    expect(ids(result.shapes)).toEqual(['b', 'a', 'd', 'c'])
  })

  it('moves contiguous selection together when there is an unselected neighbor above', () => {
    // a b c — select a and b
    const shapes = [makeRect('a'), makeRect('b'), makeRect('c')]
    const result = reorderStep(shapes, ['a', 'b'], 'forward')

    expect(result.changed).toBe(true)
    // b swaps with c, a swaps with b's old slot (now c)
    expect(ids(result.shapes)).toEqual(['c', 'a', 'b'])
  })

  it('contiguous selection at the front is a no-op', () => {
    const shapes = [makeRect('a'), makeRect('b'), makeRect('c')]
    const result = reorderStep(shapes, ['b', 'c'], 'forward')

    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('locked selected shapes do not move', () => {
    const shapes = [makeRect('a', { locked: true }), makeRect('b')]
    const result = reorderStep(shapes, ['a'], 'forward')

    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('locked unselected shapes act as anchors — selected shape cannot pass them', () => {
    const shapes = [makeRect('a'), makeRect('b', { locked: true })]
    const result = reorderStep(shapes, ['a'], 'forward')

    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('hidden shapes remain reorderable', () => {
    const shapes = [makeRect('a', { visible: false }), makeRect('b')]
    const result = reorderStep(shapes, ['a'], 'forward')

    expect(result.changed).toBe(true)
    expect(ids(result.shapes)).toEqual(['b', 'a'])
  })
})

describe('reorderStep — sendBackward (direction: backward)', () => {
  it('moves a single selected shape one step toward the back', () => {
    const shapes = [makeRect('a'), makeRect('b'), makeRect('c')]
    const result = reorderStep(shapes, ['b'], 'backward')

    expect(result.changed).toBe(true)
    expect(ids(result.shapes)).toEqual(['b', 'a', 'c'])
  })

  it('is a no-op when the shape is already backmost', () => {
    const shapes = [makeRect('a'), makeRect('b'), makeRect('c')]
    const result = reorderStep(shapes, ['a'], 'backward')

    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('moves non-contiguous selection per-neighbor without collapsing', () => {
    const shapes = [makeRect('a'), makeRect('b'), makeRect('c'), makeRect('d')]
    const result = reorderStep(shapes, ['b', 'd'], 'backward')

    expect(result.changed).toBe(true)
    // b swaps with a, d swaps with c
    expect(ids(result.shapes)).toEqual(['b', 'a', 'd', 'c'])
  })

  it('moves contiguous selection together when there is an unselected neighbor below', () => {
    // a b c — select b and c
    const shapes = [makeRect('a'), makeRect('b'), makeRect('c')]
    const result = reorderStep(shapes, ['b', 'c'], 'backward')

    expect(result.changed).toBe(true)
    expect(ids(result.shapes)).toEqual(['b', 'c', 'a'])
  })

  it('contiguous selection at the back is a no-op', () => {
    const shapes = [makeRect('a'), makeRect('b'), makeRect('c')]
    const result = reorderStep(shapes, ['a', 'b'], 'backward')

    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('locked unselected shapes act as anchors', () => {
    const shapes = [makeRect('a', { locked: true }), makeRect('b')]
    const result = reorderStep(shapes, ['b'], 'backward')

    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })
})

describe('reorderStep — edge cases', () => {
  it('returns unchanged when shapes array is empty', () => {
    const result = reorderStep([], ['a'], 'forward')
    expect(result.changed).toBe(false)
  })

  it('returns unchanged when selectedIds is empty', () => {
    const shapes = [makeRect('a')]
    const result = reorderStep(shapes, [], 'forward')
    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('ignores selected IDs that do not exist in the shapes array', () => {
    const shapes = [makeRect('a'), makeRect('b')]
    const result = reorderStep(shapes, ['nonexistent'], 'forward')
    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('all shapes selected — forward is a no-op', () => {
    const shapes = [makeRect('a'), makeRect('b'), makeRect('c')]
    const result = reorderStep(shapes, ['a', 'b', 'c'], 'forward')
    expect(result.changed).toBe(false)
  })

  it('all shapes selected — backward is a no-op', () => {
    const shapes = [makeRect('a'), makeRect('b'), makeRect('c')]
    const result = reorderStep(shapes, ['a', 'b', 'c'], 'backward')
    expect(result.changed).toBe(false)
  })

  it('non-contiguous with locked anchor between them', () => {
    // a(sel) L(locked) b(sel) c
    const shapes = [makeRect('a'), makeRect('L', { locked: true }), makeRect('b'), makeRect('c')]
    const result = reorderStep(shapes, ['a', 'b'], 'forward')

    expect(result.changed).toBe(true)
    // a cannot pass L (locked anchor), b swaps with c
    expect(ids(result.shapes)).toEqual(['a', 'L', 'c', 'b'])
  })

  it('locked selected shape blocks passage forward', () => {
    // a(sel) b(sel+locked) c — a must not jump past locked b
    const shapes = [makeRect('a'), makeRect('b', { locked: true }), makeRect('c')]
    const result = reorderStep(shapes, ['a', 'b'], 'forward')

    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('locked selected shape blocks passage backward', () => {
    // a b(sel+locked) c(sel) — c must not jump past locked b
    const shapes = [makeRect('a'), makeRect('b', { locked: true }), makeRect('c')]
    const result = reorderStep(shapes, ['b', 'c'], 'backward')

    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })
})
