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
  it('clicking rect adds a rect to the document', () => {
    const store = makeStore()
    const actions = createToolbarActions(store)

    actions.handleItemClick('rect')

    const shapes = store.get(documentAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({
      type: 'rect',
      x: 4,
      y: 4,
      width: 16,
      height: 16,
      fill: '#000',
    })
  })

  it('clicking rect sets the active tool to rect', () => {
    const store = makeStore()
    store.set(activeToolAtom, 'ellipse')
    const actions = createToolbarActions(store)

    actions.handleChange('rect')

    expect(store.get(activeToolAtom)).toBe('rect')
  })

  it('clicking the already-active tool still adds a shape', () => {
    const store = makeStore()
    store.set(activeToolAtom, 'rect')
    const actions = createToolbarActions(store)

    actions.handleItemClick('rect')
    actions.handleItemClick('rect')

    const shapes = store.get(documentAtom).shapes
    expect(shapes).toHaveLength(2)
  })

  it('clicking an unknown tool value does not add a shape', () => {
    const store = makeStore()
    const actions = createToolbarActions(store)

    actions.handleItemClick('ellipse')
    actions.handleItemClick('')

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
