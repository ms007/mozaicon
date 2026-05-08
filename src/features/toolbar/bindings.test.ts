import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { getHint } from '@/features/shortcuts/registry'
import { documentAtom } from '@/store/atoms/document'
import { activeToolAtom } from '@/store/atoms/tool'
import type { Document } from '@/types/shapes'

import { createToolbarBindings, TOOLBAR_SHORTCUT_META } from './bindings'

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
  it('hint lookup returns "R" for the rect binding id', () => {
    const hint = getHint(TOOLBAR_SHORTCUT_META, 'tool.rect.activate')
    expect(hint).toBe('R')
  })

  it('hint lookup returns undefined for an unknown id', () => {
    const hint = getHint(TOOLBAR_SHORTCUT_META, 'tool.unknown')
    expect(hint).toBeUndefined()
  })

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
