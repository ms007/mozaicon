import { describe, expect, it } from 'vitest'

import { CanvasStage } from '@/features/canvas/CanvasStage'
import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { draftShapeAtom } from '@/store/atoms/draft'
import { activeIconAtom } from '@/store/atoms/project'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import { renderWithStore } from '@/test/renderWithStore'
import type { Icon } from '@/types/shapes'

const seededDoc: Icon = {
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
      corners: DEFAULT_CORNERS,
    },
  ],
}

function makeSvgRef(): React.RefObject<SVGSVGElement | null> {
  return { current: null }
}

describe('CanvasStage', () => {
  it('renders a <rect> with the seeded shape attributes', () => {
    const { container } = renderWithStore(<CanvasStage svgRef={makeSvgRef()} />, (store) => {
      store.set(activeIconAtom, seededDoc)
    })

    const rect = container.querySelector('rect[fill="#000"]')
    expect(rect).not.toBeNull()
    expect(rect?.getAttribute('x')).toBe('4')
    expect(rect?.getAttribute('y')).toBe('4')
    expect(rect?.getAttribute('width')).toBe('16')
    expect(rect?.getAttribute('height')).toBe('16')
    expect(rect?.getAttribute('fill')).toBe('#000')
  })

  it('renders the canvas with the document viewBox', () => {
    const { container } = renderWithStore(<CanvasStage svgRef={makeSvgRef()} />, (store) => {
      store.set(activeIconAtom, seededDoc)
    })

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
  })

  it('renders one <rect> per shape in the document', () => {
    const doc: Icon = {
      ...seededDoc,
      shapes: [
        { ...seededDoc.shapes[0], id: 'r1' },
        { ...seededDoc.shapes[0], id: 'r2', x: 10 },
      ],
    }
    const { container } = renderWithStore(<CanvasStage svgRef={makeSvgRef()} />, (store) => {
      store.set(activeIconAtom, doc)
    })

    expect(container.querySelectorAll('rect[fill="#000"]')).toHaveLength(2)
  })

  it('sets overflow visible so edge grid dots are not clipped', () => {
    const { container } = renderWithStore(<CanvasStage svgRef={makeSvgRef()} />, (store) => {
      store.set(activeIconAtom, seededDoc)
    })

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('overflow')).toBe('visible')
  })

  it('renders draft shape and selection overlay bbox when draftShapeAtom is set', () => {
    const { container } = renderWithStore(<CanvasStage svgRef={makeSvgRef()} />, (store) => {
      store.set(activeIconAtom, { ...seededDoc, shapes: [] })
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
        corners: DEFAULT_CORNERS,
      })
    })

    expect(container.querySelectorAll('rect:not([data-testid="pixel-grid"])')).toHaveLength(2)
    expect(container.querySelector('rect[fill="#000"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="selection-overlay"]')).not.toBeNull()
  })

  it('mounts SelectionOverlay when a shape is selected', () => {
    const { container } = renderWithStore(<CanvasStage svgRef={makeSvgRef()} />, (store) => {
      store.set(activeIconAtom, seededDoc)
      store.set(selectShapesCommand, ['r1'])
    })

    expect(container.querySelector('rect[vector-effect="non-scaling-stroke"]')).not.toBeNull()
  })
})
