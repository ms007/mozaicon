import { describe, expect, it } from 'vitest'

import { CanvasStage } from '@/features/canvas/CanvasStage'
import { documentAtom } from '@/store/atoms/document'
import { draftShapeAtom } from '@/store/atoms/draft'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { activeToolAtom } from '@/store/atoms/tool'
import { renderWithStore } from '@/test/renderWithStore'
import type { Document } from '@/types/shapes'

const seededDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [
    {
      id: 'r1',
      name: 'Rect 1',
      visible: true,
      locked: false,
      type: 'rect',
      x: 4,
      y: 4,
      width: 16,
      height: 16,
      fill: '#000',
    },
  ],
}

describe('CanvasStage', () => {
  it('renders a <rect> with the seeded shape attributes', () => {
    const { container } = renderWithStore(<CanvasStage />, (store) => {
      store.set(documentAtom, seededDoc)
    })

    const rect = container.querySelector('rect')
    expect(rect).not.toBeNull()
    expect(rect?.getAttribute('x')).toBe('4')
    expect(rect?.getAttribute('y')).toBe('4')
    expect(rect?.getAttribute('width')).toBe('16')
    expect(rect?.getAttribute('height')).toBe('16')
    expect(rect?.getAttribute('fill')).toBe('#000')
  })

  it('renders the canvas with the document viewBox', () => {
    const { container } = renderWithStore(<CanvasStage />, (store) => {
      store.set(documentAtom, seededDoc)
    })

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
  })

  it('renders one <rect> per shape in the document', () => {
    const doc: Document = {
      ...seededDoc,
      shapes: [
        { ...seededDoc.shapes[0], id: 'r1' },
        { ...seededDoc.shapes[0], id: 'r2', x: 10 },
      ],
    }
    const { container } = renderWithStore(<CanvasStage />, (store) => {
      store.set(documentAtom, doc)
    })

    expect(container.querySelectorAll('rect')).toHaveLength(2)
  })

  it('applies no tool cursor when no tool is active', () => {
    const { container } = renderWithStore(<CanvasStage />, (store) => {
      store.set(documentAtom, seededDoc)
    })

    const svg = container.querySelector('svg')
    expect(svg?.classList.contains('cursor-crosshair')).toBe(false)
  })

  it('applies crosshair cursor when a draw tool is active', () => {
    const { container } = renderWithStore(<CanvasStage />, (store) => {
      store.set(documentAtom, seededDoc)
      store.set(activeToolAtom, 'rect')
    })

    const svg = container.querySelector('svg')
    expect(svg?.classList.contains('cursor-crosshair')).toBe(true)
  })

  it('renders draft shape and selection overlay bbox when draftShapeAtom is set', () => {
    const { container } = renderWithStore(<CanvasStage />, (store) => {
      store.set(documentAtom, { ...seededDoc, shapes: [] })
      store.set(draftShapeAtom, {
        type: 'rect',
        id: '__draft__',
        name: 'Rect',
        visible: true,
        locked: false,
        x: 2,
        y: 2,
        width: 8,
        height: 6,
        fill: '#000',
      })
    })

    expect(container.querySelectorAll('rect')).toHaveLength(2)
    expect(container.querySelector('[data-testid="selection-overlay"]')).not.toBeNull()
  })

  it('mounts SelectionOverlay when a shape is selected', () => {
    const { container } = renderWithStore(<CanvasStage />, (store) => {
      store.set(documentAtom, seededDoc)
      store.set(selectedIdsAtom, ['r1'])
    })

    expect(container.querySelector('rect[vector-effect="non-scaling-stroke"]')).not.toBeNull()
  })
})
