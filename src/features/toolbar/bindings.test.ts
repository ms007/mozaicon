import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { activeToolAtom } from '@/store/atoms/tool'
import type { Document } from '@/types/shapes'

import { createToolbarBindings } from './bindings'

const emptyDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [],
}

function makeStore(doc: Document = emptyDoc) {
  const store = createStore()
  store.set(documentAtom, doc)
  return store
}

describe('toolbar bindings', () => {
  it('produces exactly one binding for the rect action', () => {
    const store = makeStore()
    const bindings = createToolbarBindings(store)

    expect(bindings).toHaveLength(1)
    expect(bindings[0].id).toBe('tool.rect.activate')
    expect(bindings[0].key).toBe('R')
    expect(bindings[0].hint).toBe('R')
  })

  it('invoking the rect binding activates the rect tool but does not add a shape', () => {
    const store = makeStore()
    store.set(activeToolAtom, 'select')
    const bindings = createToolbarBindings(store)

    bindings[0].run()

    expect(store.get(activeToolAtom)).toBe('rect')
    expect(store.get(documentAtom).shapes).toHaveLength(0)
  })
})
