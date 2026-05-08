import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { activeToolAtom } from '@/store/atoms/tool'
import type { Document } from '@/types/shapes'

import { createToolbarActions } from './actions'

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

describe('Toolbar', () => {
  it('clicking rect activates the rect tool', () => {
    const store = makeStore()
    store.set(activeToolAtom, 'ellipse')
    const actions = createToolbarActions(store)

    actions.handleChange('rect')

    expect(store.get(activeToolAtom)).toBe('rect')
  })

  it('clicking rect does not insert a shape', () => {
    const store = makeStore()
    const actions = createToolbarActions(store)

    actions.handleChange('rect')

    expect(store.get(documentAtom).shapes).toHaveLength(0)
  })

  it('re-clicking the already-active tool is a no-op', () => {
    const store = makeStore()
    store.set(activeToolAtom, 'rect')
    const actions = createToolbarActions(store)

    actions.handleChange('rect')

    expect(store.get(activeToolAtom)).toBe('rect')
    expect(store.get(documentAtom).shapes).toHaveLength(0)
  })

  it('handleChange updates the active tool to any value', () => {
    const store = makeStore()
    const actions = createToolbarActions(store)

    actions.handleChange('ellipse')
    expect(store.get(activeToolAtom)).toBe('ellipse')

    actions.handleChange('rect')
    expect(store.get(activeToolAtom)).toBe('rect')
  })
})
