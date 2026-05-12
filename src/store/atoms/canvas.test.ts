import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import type { Document } from '@/types/shapes'

import { CANVAS_SIZE, viewBoxScaleAtom } from './canvas'
import { documentAtom } from './document'

const baseDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [],
}

describe('viewBoxScaleAtom', () => {
  it('returns screen pixels per viewBox unit for default 24×24 viewBox', () => {
    const store = createStore()
    store.set(documentAtom, baseDoc)
    expect(store.get(viewBoxScaleAtom)).toBeCloseTo(CANVAS_SIZE / 24)
  })

  it('updates when viewBox changes (simulating zoom)', () => {
    const store = createStore()
    store.set(documentAtom, { ...baseDoc, viewBox: [0, 0, 48, 48] })
    expect(store.get(viewBoxScaleAtom)).toBeCloseTo(CANVAS_SIZE / 48)
  })

  it('handles non-square viewBox by deriving from width', () => {
    const store = createStore()
    store.set(documentAtom, { ...baseDoc, viewBox: [0, 0, 12, 24] })
    expect(store.get(viewBoxScaleAtom)).toBeCloseTo(CANVAS_SIZE / 12)
  })
})
