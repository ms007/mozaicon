import { describe, expect, it } from 'vitest'

import { makeRect } from '@/test/fixtures/shapes'

import { bringToFront, moveBlockBefore, sendToBack } from './block'

function ids(shapes: { id: string }[]): string[] {
  return shapes.map((s) => s.id)
}

const a = makeRect({ id: 'a' })
const b = makeRect({ id: 'b' })
const c = makeRect({ id: 'c' })
const d = makeRect({ id: 'd' })
const e = makeRect({ id: 'e' })

const aLocked = makeRect({ id: 'a', locked: true })
const bLocked = makeRect({ id: 'b', locked: true })
const cHidden = makeRect({ id: 'c', visible: false })

describe('moveBlockBefore', () => {
  it('inserts a single shape before a target', () => {
    const result = moveBlockBefore([a, b, c], ['c'], 'a')
    expect(ids(result.shapes)).toEqual(['c', 'a', 'b'])
    expect(result.changed).toBe(true)
  })

  it('inserts multiple shapes before a target, preserving relative order', () => {
    const result = moveBlockBefore([a, b, c, d], ['a', 'c'], 'd')
    expect(ids(result.shapes)).toEqual(['b', 'a', 'c', 'd'])
    expect(result.changed).toBe(true)
  })

  it('appends to end when beforeId is null', () => {
    const result = moveBlockBefore([a, b, c], ['a'], null)
    expect(ids(result.shapes)).toEqual(['b', 'c', 'a'])
    expect(result.changed).toBe(true)
  })

  it('returns changed=false when move is a no-op', () => {
    const shapes = [a, b, c]
    const result = moveBlockBefore(shapes, ['c'], null)
    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('returns changed=false for empty ids', () => {
    const shapes = [a, b, c]
    const result = moveBlockBefore(shapes, [], 'a')
    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('filters out locked shapes from the moving block', () => {
    const result = moveBlockBefore([aLocked, b, c], ['a', 'b'], null)
    expect(ids(result.shapes)).toEqual(['a', 'c', 'b'])
    expect(result.changed).toBe(true)
  })

  it('is a no-op when all selected shapes are locked', () => {
    const shapes = [aLocked, bLocked, c]
    const result = moveBlockBefore(shapes, ['a', 'b'], null)
    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('collapses non-contiguous selection into one block', () => {
    const result = moveBlockBefore([a, b, c, d, e], ['a', 'c', 'e'], 'b')
    expect(ids(result.shapes)).toEqual(['a', 'c', 'e', 'b', 'd'])
    expect(result.changed).toBe(true)
  })

  it('falls back to append when beforeId is not in the rest', () => {
    const result = moveBlockBefore([a, b, c], ['a'], 'nonexistent')
    expect(ids(result.shapes)).toEqual(['b', 'c', 'a'])
    expect(result.changed).toBe(true)
  })
})

describe('bringToFront', () => {
  it('moves selection to the end (front)', () => {
    const result = bringToFront([a, b, c], ['a'])
    expect(ids(result.shapes)).toEqual(['b', 'c', 'a'])
    expect(result.changed).toBe(true)
  })

  it('preserves relative order of non-contiguous selection', () => {
    const result = bringToFront([a, b, c, d, e], ['a', 'c', 'e'])
    expect(ids(result.shapes)).toEqual(['b', 'd', 'a', 'c', 'e'])
    expect(result.changed).toBe(true)
  })

  it('is a no-op when already at front', () => {
    const shapes = [a, b, c]
    const result = bringToFront(shapes, ['b', 'c'])
    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('skips locked shapes and moves only unlocked ones', () => {
    const result = bringToFront([aLocked, b, c], ['a', 'b'])
    expect(ids(result.shapes)).toEqual(['a', 'c', 'b'])
    expect(result.changed).toBe(true)
  })

  it('no-op for all-locked selection', () => {
    const shapes = [aLocked, bLocked, c]
    const result = bringToFront(shapes, ['a', 'b'])
    expect(result.changed).toBe(false)
  })

  it('handles empty ids', () => {
    const shapes = [a, b, c]
    const result = bringToFront(shapes, [])
    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('hidden shapes are fully reorderable', () => {
    const result = bringToFront([cHidden, a, b], ['c'])
    expect(ids(result.shapes)).toEqual(['a', 'b', 'c'])
    expect(result.changed).toBe(true)
  })
})

describe('sendToBack', () => {
  it('moves selection to the beginning (back)', () => {
    const result = sendToBack([a, b, c], ['c'])
    expect(ids(result.shapes)).toEqual(['c', 'a', 'b'])
    expect(result.changed).toBe(true)
  })

  it('preserves relative order of non-contiguous selection', () => {
    const result = sendToBack([a, b, c, d, e], ['b', 'd'])
    expect(ids(result.shapes)).toEqual(['b', 'd', 'a', 'c', 'e'])
    expect(result.changed).toBe(true)
  })

  it('is a no-op when already at back', () => {
    const shapes = [a, b, c]
    const result = sendToBack(shapes, ['a', 'b'])
    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('skips locked shapes and moves only unlocked ones', () => {
    const result = sendToBack([a, b, cHidden], ['b', 'c'])
    expect(ids(result.shapes)).toEqual(['b', 'c', 'a'])
    expect(result.changed).toBe(true)
  })

  it('no-op for all-locked selection', () => {
    const shapes = [aLocked, bLocked, c]
    const result = sendToBack(shapes, ['a', 'b'])
    expect(result.changed).toBe(false)
  })

  it('handles empty ids', () => {
    const shapes = [a, b, c]
    const result = sendToBack(shapes, [])
    expect(result.changed).toBe(false)
    expect(result.shapes).toBe(shapes)
  })

  it('hidden shapes are fully reorderable', () => {
    const result = sendToBack([a, b, cHidden], ['c'])
    expect(ids(result.shapes)).toEqual(['c', 'a', 'b'])
    expect(result.changed).toBe(true)
  })

  it('locked anchors stay fixed while block slides around them', () => {
    const result = sendToBack([aLocked, b, c, d], ['a', 'c', 'd'])
    expect(ids(result.shapes)).toEqual(['c', 'd', 'a', 'b'])
    expect(result.changed).toBe(true)
  })
})
