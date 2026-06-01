import { render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import type { Document } from '@/types/shapes'

import { LayersPanel } from './LayersPanel'

const emptyDoc: Document = {
  id: 'doc-empty',
  name: 'Empty',
  viewBox: [0, 0, 24, 24],
  shapes: [],
}

const twoShapeDoc: Document = {
  id: 'doc-2',
  name: 'Two',
  viewBox: [0, 0, 24, 24],
  shapes: [
    {
      id: 'a',
      name: 'Bottom',
      visible: true,
      locked: false,
      type: 'rect',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    },
    {
      id: 'b',
      name: 'Top',
      visible: false,
      locked: false,
      type: 'rect',
      x: 5,
      y: 5,
      width: 8,
      height: 8,
    },
  ],
}

function renderWithStore(doc: Document) {
  const store = createStore()
  store.set(documentAtom, doc)
  return render(
    <Provider store={store}>
      <LayersPanel />
    </Provider>,
  )
}

describe('LayersPanel', () => {
  it('shows muted placeholder when document has no shapes', () => {
    renderWithStore(emptyDoc)
    expect(screen.getByText('No layers yet')).toBeInTheDocument()
  })

  it('renders one row per shape with names in reverse z-order', () => {
    renderWithStore(twoShapeDoc)
    expect(screen.queryByText('No layers yet')).not.toBeInTheDocument()

    const items = screen.getAllByText(/^(Top|Bottom)$/)
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toBe('Top')
    expect(items[1].textContent).toBe('Bottom')
  })

  it('has the Layers heading', () => {
    renderWithStore(emptyDoc)
    expect(screen.getByRole('heading', { name: 'Layers' })).toBeInTheDocument()
  })
})
