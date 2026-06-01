import { atom } from 'jotai'
import { describe, expect, it } from 'vitest'

import { HoverHighlightOverlay } from '@/features/canvas/HoverHighlightOverlay'
import { documentAtom } from '@/store/atoms/document'
import { type GestureAdapter, setGestureRegistryForTest } from '@/store/atoms/gestures/registry'
import { hoveredShapeIdAtom } from '@/store/atoms/hover'
import { selectShapesCommand } from '@/store/commands/selectionCommands'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import { renderWithStore, type TestStore } from '@/test/renderWithStore'

const testDoc = makeDoc([
  makeRect({ id: 'r1', x: 2, y: 4, width: 6, height: 8 }),
  makeRect({ id: 'r2', x: 10, y: 12, width: 4, height: 4, visible: false }),
  makeRect({ id: 'r3', x: 20, y: 20, width: 5, height: 5 }),
])

function renderOverlay(seed?: (store: TestStore) => void) {
  return renderWithStore(
    <svg>
      <HoverHighlightOverlay />
    </svg>,
    seed,
  )
}

describe('HoverHighlightOverlay', () => {
  it('renders nothing when no shape is hovered', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
    })
    expect(container.querySelector('[data-testid="hover-highlight"]')).toBeNull()
  })

  it('renders a bounding box rect for a hovered visible non-selected shape', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(hoveredShapeIdAtom, 'r1')
    })

    const rect = container.querySelector('[data-testid="hover-highlight"]')
    expect(rect).not.toBeNull()
    expect(rect?.getAttribute('x')).toBe('2')
    expect(rect?.getAttribute('y')).toBe('4')
    expect(rect?.getAttribute('width')).toBe('6')
    expect(rect?.getAttribute('height')).toBe('8')
    expect(rect?.classList.contains('stroke-primary')).toBe(true)
    expect(rect?.getAttribute('fill')).toBe('none')
    expect(rect?.getAttribute('stroke-width')).toBe('1.5')
    expect(rect?.getAttribute('vector-effect')).toBe('non-scaling-stroke')
    expect(rect?.getAttribute('pointer-events')).toBe('none')
  })

  it('suppresses when the hovered shape is already selected', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(selectShapesCommand, ['r1'])
      store.set(hoveredShapeIdAtom, 'r1')
    })
    expect(container.querySelector('[data-testid="hover-highlight"]')).toBeNull()
  })

  it('suppresses when the hovered shape is hidden', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(hoveredShapeIdAtom, 'r2')
    })
    expect(container.querySelector('[data-testid="hover-highlight"]')).toBeNull()
  })

  it('suppresses when a gesture is active', () => {
    const draftAtom = atom<object | null>({})
    const fakeAdapter: GestureAdapter<object> = {
      name: 'fake',
      draftAtom,
    }
    const restore = setGestureRegistryForTest([fakeAdapter])

    try {
      const { container } = renderOverlay((store) => {
        store.set(documentAtom, testDoc)
        store.set(hoveredShapeIdAtom, 'r1')
      })
      expect(container.querySelector('[data-testid="hover-highlight"]')).toBeNull()
    } finally {
      restore()
    }
  })

  it('shows highlight for non-selected shape during multi-selection', () => {
    const { container } = renderOverlay((store) => {
      store.set(documentAtom, testDoc)
      store.set(selectShapesCommand, ['r1'])
      store.set(hoveredShapeIdAtom, 'r3')
    })

    const rect = container.querySelector('[data-testid="hover-highlight"]')
    expect(rect).not.toBeNull()
    expect(rect?.getAttribute('x')).toBe('20')
    expect(rect?.getAttribute('y')).toBe('20')
    expect(rect?.getAttribute('width')).toBe('5')
    expect(rect?.getAttribute('height')).toBe('5')
  })
})
