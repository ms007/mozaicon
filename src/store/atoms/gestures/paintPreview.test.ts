import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import {
  type PaintOverride,
  paintPreviewAdapter,
  paintPreviewDraftAtom,
  paintPreviewDraftForShapeAtom,
} from './paintPreview'

describe('paintPreviewDraftAtom', () => {
  it('starts as null', () => {
    const store = createStore()
    expect(store.get(paintPreviewDraftAtom)).toBeNull()
  })

  it('accepts a fill-only override', () => {
    const store = createStore()
    store.set(paintPreviewDraftAtom, { r1: { fill: '#ff0000' } })

    expect(store.get(paintPreviewDraftAtom)).toEqual({ r1: { fill: '#ff0000' } })
  })

  it('accepts a mixed fill + stroke + strokeWidth override', () => {
    const store = createStore()
    const draft: Record<string, PaintOverride> = {
      r1: { fill: '#ff0000', stroke: '#00ff00', strokeWidth: 3 },
    }
    store.set(paintPreviewDraftAtom, draft)

    expect(store.get(paintPreviewDraftAtom)).toEqual(draft)
  })

  it('can be cleared back to null', () => {
    const store = createStore()
    store.set(paintPreviewDraftAtom, { r1: { fill: '#ff0000' } })
    store.set(paintPreviewDraftAtom, null)

    expect(store.get(paintPreviewDraftAtom)).toBeNull()
  })
})

describe('paintPreviewDraftForShapeAtom', () => {
  it('returns null when draft is null', () => {
    const store = createStore()
    expect(store.get(paintPreviewDraftForShapeAtom('r1'))).toBeNull()
  })

  it('returns null for a shape not in the draft', () => {
    const store = createStore()
    store.set(paintPreviewDraftAtom, { r1: { stroke: '#000' } })

    expect(store.get(paintPreviewDraftForShapeAtom('r2'))).toBeNull()
  })

  it('returns the fill override for a specific shape', () => {
    const store = createStore()
    store.set(paintPreviewDraftAtom, {
      r1: { fill: '#ff0000' },
      r2: { fill: '#00ff00' },
    })

    expect(store.get(paintPreviewDraftForShapeAtom('r1'))).toEqual({ fill: '#ff0000' })
    expect(store.get(paintPreviewDraftForShapeAtom('r2'))).toEqual({ fill: '#00ff00' })
  })

  it('returns mixed fill+stroke override', () => {
    const store = createStore()
    store.set(paintPreviewDraftAtom, {
      r1: { fill: '#ff0000', stroke: '#00ff00', strokeWidth: 5 },
    })

    expect(store.get(paintPreviewDraftForShapeAtom('r1'))).toEqual({
      fill: '#ff0000',
      stroke: '#00ff00',
      strokeWidth: 5,
    })
  })

  it('uses structural equality — same values do not trigger a new reference', () => {
    const store = createStore()
    store.set(paintPreviewDraftAtom, { r1: { fill: '#ff0000', stroke: '#000' } })
    const first = store.get(paintPreviewDraftForShapeAtom('r1'))

    store.set(paintPreviewDraftAtom, { r1: { fill: '#ff0000', stroke: '#000' } })
    const second = store.get(paintPreviewDraftForShapeAtom('r1'))

    expect(second).toBe(first)
  })

  it('returns a new reference when fill changes', () => {
    const store = createStore()
    store.set(paintPreviewDraftAtom, { r1: { fill: '#ff0000' } })
    const first = store.get(paintPreviewDraftForShapeAtom('r1'))

    store.set(paintPreviewDraftAtom, { r1: { fill: '#00ff00' } })
    const second = store.get(paintPreviewDraftForShapeAtom('r1'))

    expect(second).not.toBe(first)
    expect(second).toEqual({ fill: '#00ff00' })
  })
})

describe('paintPreviewAdapter', () => {
  it('has blocksCommands: false', () => {
    expect(paintPreviewAdapter.blocksCommands).toBe(false)
  })

  it('shares the draftAtom with paintPreviewDraftAtom', () => {
    expect(paintPreviewAdapter.draftAtom).toBe(paintPreviewDraftAtom)
  })

  it('is named paintPreview', () => {
    expect(paintPreviewAdapter.name).toBe('paintPreview')
  })
})
