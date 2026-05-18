import { createRef } from 'react'
import { describe, expect, it } from 'vitest'

import { SelectionOverlay } from '@/features/canvas/SelectionOverlay'
import { CANVAS_SIZE } from '@/store/atoms/canvas'
import { documentAtom } from '@/store/atoms/document'
import { draftShapeAtom } from '@/store/atoms/draft'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import { makeRect } from '@/test/fixtures/shapes'
import { renderWithStore, type TestStore } from '@/test/renderWithStore'
import type { Document } from '@/types/shapes'

const testDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [
    makeRect({ id: 'r1', x: 2, y: 4, width: 6, height: 8 }),
    makeRect({ id: 'r2', x: 10, y: 12, width: 4, height: 4 }),
  ],
}

const svgRef = createRef<SVGSVGElement>()

function renderOverlay(seed?: (store: TestStore) => void) {
  return renderWithStore(
    <svg>
      <SelectionOverlay svgRef={svgRef} />
    </svg>,
    seed,
  )
}

describe('SelectionOverlay', () => {
  it('renders nothing when the selection is empty', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
    })

    expect(container.querySelectorAll('rect')).toHaveLength(0)
  })

  it('renders a rect matching the selection bbox with the expected SVG attributes', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(selectShapesCommand, ['r1'])
    })

    const rect = container.querySelector('rect')
    expect(rect).not.toBeNull()
    expect(rect?.getAttribute('x')).toBe('2')
    expect(rect?.getAttribute('y')).toBe('4')
    expect(rect?.getAttribute('width')).toBe('6')
    expect(rect?.getAttribute('height')).toBe('8')
    expect(rect?.getAttribute('fill')).toBe('none')
    expect(rect?.classList.contains('stroke-primary')).toBe(true)
    expect(rect?.getAttribute('stroke-width')).toBe('2')
    expect(rect?.getAttribute('vector-effect')).toBe('non-scaling-stroke')
    expect(rect?.getAttribute('pointer-events')).toBe('none')
  })

  it('renders the union bbox when multiple shapes are selected', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(selectShapesCommand, ['r1', 'r2'])
    })

    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(1)

    const rect = rects[0]
    expect(rect.getAttribute('x')).toBe('2')
    expect(rect.getAttribute('y')).toBe('4')
    expect(rect.getAttribute('width')).toBe('12')
    expect(rect.getAttribute('height')).toBe('12')
  })

  it('tracks the draft shape bbox during drag-to-draw, with resize handles visible', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(draftShapeAtom, makeRect({ id: '__draft__', x: 3, y: 5, width: 9, height: 7 }))
    })

    const overlay = container.querySelector('[data-testid="selection-overlay"]')
    expect(overlay?.getAttribute('x')).toBe('3')
    expect(overlay?.getAttribute('y')).toBe('5')
    expect(overlay?.getAttribute('width')).toBe('9')
    expect(overlay?.getAttribute('height')).toBe('7')

    expect(container.querySelectorAll('[data-handle]')).toHaveLength(8)
  })
})

describe('ResizeHandles', () => {
  it('renders no handles when the selection is empty', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
    })

    expect(container.querySelectorAll('[data-handle]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-handle-hit]')).toHaveLength(0)
  })

  it('renders exactly 8 visible circles and 8 hit-area circles for a single selection', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(selectShapesCommand, ['r1'])
    })

    const handles = container.querySelectorAll('[data-handle]')
    const hitAreas = container.querySelectorAll('[data-handle-hit]')
    expect(handles).toHaveLength(8)
    expect(hitAreas).toHaveLength(8)
  })

  it('renders 8 handles around the union bbox for multi-shape selection', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(selectShapesCommand, ['r1', 'r2'])
    })

    expect(container.querySelectorAll('[data-handle]')).toHaveLength(8)
  })

  it('positions corner handles at bbox corners and edge handles at midpoints', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(selectShapesCommand, ['r1'])
    })

    const handle = (pos: string) => container.querySelector(`[data-handle="${pos}"]`)

    // r1 bbox: x=2, y=4, width=6, height=8
    expect(handle('nw')?.getAttribute('cx')).toBe('2')
    expect(handle('nw')?.getAttribute('cy')).toBe('4')

    expect(handle('ne')?.getAttribute('cx')).toBe('8')
    expect(handle('ne')?.getAttribute('cy')).toBe('4')

    expect(handle('se')?.getAttribute('cx')).toBe('8')
    expect(handle('se')?.getAttribute('cy')).toBe('12')

    expect(handle('sw')?.getAttribute('cx')).toBe('2')
    expect(handle('sw')?.getAttribute('cy')).toBe('12')

    expect(handle('n')?.getAttribute('cx')).toBe('5')
    expect(handle('n')?.getAttribute('cy')).toBe('4')

    expect(handle('s')?.getAttribute('cx')).toBe('5')
    expect(handle('s')?.getAttribute('cy')).toBe('12')

    expect(handle('e')?.getAttribute('cx')).toBe('8')
    expect(handle('e')?.getAttribute('cy')).toBe('8')

    expect(handle('w')?.getAttribute('cx')).toBe('2')
    expect(handle('w')?.getAttribute('cy')).toBe('8')
  })

  it('applies correct resize cursors per handle position', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(selectShapesCommand, ['r1'])
    })

    const cursor = (pos: string) =>
      container.querySelector(`[data-handle="${pos}"]`)?.getAttribute('style')

    expect(cursor('nw')).toContain('nwse-resize')
    expect(cursor('se')).toContain('nwse-resize')
    expect(cursor('ne')).toContain('nesw-resize')
    expect(cursor('sw')).toContain('nesw-resize')
    expect(cursor('n')).toContain('ns-resize')
    expect(cursor('s')).toContain('ns-resize')
    expect(cursor('e')).toContain('ew-resize')
    expect(cursor('w')).toContain('ew-resize')
  })

  it('visible handles have fill-background, stroke-primary, and non-scaling-stroke', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(selectShapesCommand, ['r1'])
    })

    const handle = container.querySelector('[data-handle="nw"]')
    expect(handle).not.toBeNull()
    expect(handle?.classList.contains('fill-background')).toBe(true)
    expect(handle?.classList.contains('stroke-primary')).toBe(true)
    expect(handle?.getAttribute('vector-effect')).toBe('non-scaling-stroke')
  })

  it('hit-area circles have double the visual radius and are transparent', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(selectShapesCommand, ['r1'])
    })

    const visual = container.querySelector('[data-handle="nw"]')
    const hit = container.querySelector('[data-handle-hit="nw"]')
    expect(visual).not.toBeNull()
    expect(hit).not.toBeNull()

    const vr = Number(visual?.getAttribute('r'))
    const hr = Number(hit?.getAttribute('r'))
    expect(hr).toBeCloseTo(vr * 2)
    expect(hit?.getAttribute('fill')).toBe('transparent')
  })

  it('handle radius is zoom-stable: 4 / viewBoxScale yields same screen pixels at different zoom levels', () => {
    const scale24 = CANVAS_SIZE / 24
    const scale48 = CANVAS_SIZE / 48

    const { container: c1 } = renderOverlay((store) => {
      store.set(documentAtom, { ...testDoc, viewBox: [0, 0, 24, 24] })
      store.set(selectShapesCommand, ['r1'])
    })

    const { container: c2 } = renderOverlay((store) => {
      store.set(documentAtom, { ...testDoc, viewBox: [0, 0, 48, 48] })
      store.set(selectShapesCommand, ['r1'])
    })

    const h1 = c1.querySelector('[data-handle="nw"]')
    const h2 = c2.querySelector('[data-handle="nw"]')
    expect(h1).not.toBeNull()
    expect(h2).not.toBeNull()

    const r1 = Number(h1?.getAttribute('r'))
    const r2 = Number(h2?.getAttribute('r'))

    // Both yield the same effective pixel size (4px)
    expect(r1 * scale24).toBeCloseTo(4)
    expect(r2 * scale48).toBeCloseTo(4)
    // Radius values differ
    expect(r1).not.toBeCloseTo(r2)
  })
})
