import { describe, expect, it } from 'vitest'

import { SelectionOverlay } from '@/features/canvas/SelectionOverlay'
import { documentAtom } from '@/store/atoms/document'
import { selectedIdsAtom } from '@/store/atoms/selection'
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

function renderOverlay(seed?: (store: TestStore) => void) {
  return renderWithStore(
    <svg>
      <SelectionOverlay />
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

  it('renders a single shape bbox with the expected SVG attributes', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(selectedIdsAtom, ['r1'])
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

  it('renders a single rect covering the union bbox of multiple selected shapes', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(selectedIdsAtom, ['r1', 'r2'])
    })

    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(1)

    const rect = rects[0]
    expect(rect.getAttribute('x')).toBe('2')
    expect(rect.getAttribute('y')).toBe('4')
    expect(rect.getAttribute('width')).toBe('12')
    expect(rect.getAttribute('height')).toBe('12')
  })
})
