import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PixelGrid } from '@/features/canvas/PixelGrid'
import { activeIconAtom } from '@/store/atoms/project'
import { renderWithStore } from '@/test/renderWithStore'
import type { Icon } from '@/types/shapes'

function renderGrid(viewBox: [number, number, number, number] = [0, 0, 24, 24]) {
  const doc: Icon = {
    id: 'doc-test',
    name: 'Test',
    viewBox,
    shapes: [],
  }
  return renderWithStore(
    <svg>
      <PixelGrid />
    </svg>,
    (store) => {
      store.set(activeIconAtom, doc)
    },
  )
}

describe('PixelGrid', () => {
  it('renders a <pattern> with a single circle tile', () => {
    const { container } = renderGrid()

    const pattern = container.querySelector('pattern')
    expect(pattern).not.toBeNull()

    const circle = pattern?.querySelector('circle')
    expect(circle).not.toBeNull()
    expect(circle?.getAttribute('r')).toBe('0.09')
    expect(circle?.getAttribute('fill')).toBe('currentColor')
  })

  it('renders a covering rect sized to viewBox + 0.5 and offset by -0.25', () => {
    const { container } = renderGrid([0, 0, 24, 24])

    const rect = container.querySelector('rect[fill^="url(#"]')
    expect(rect).not.toBeNull()
    expect(rect?.getAttribute('x')).toBe('-0.25')
    expect(rect?.getAttribute('y')).toBe('-0.25')
    expect(rect?.getAttribute('width')).toBe('24.5')
    expect(rect?.getAttribute('height')).toBe('24.5')
  })

  it('updates covering rect when viewBox size changes', () => {
    const { container, store } = renderGrid([0, 0, 24, 24])

    act(() => {
      store.set(activeIconAtom, {
        id: 'doc-test',
        name: 'Test',
        viewBox: [0, 0, 32, 32],
        shapes: [],
      })
    })

    const rect = container.querySelector('rect[fill^="url(#"]')
    expect(rect?.getAttribute('width')).toBe('32.5')
    expect(rect?.getAttribute('height')).toBe('32.5')
  })

  it('updates covering rect when viewBox origin is non-zero', () => {
    const { container } = renderGrid([-4, -4, 32, 32])

    const rect = container.querySelector('rect[fill^="url(#"]')
    expect(rect?.getAttribute('x')).toBe('-4.25')
    expect(rect?.getAttribute('y')).toBe('-4.25')
    expect(rect?.getAttribute('width')).toBe('32.5')
    expect(rect?.getAttribute('height')).toBe('32.5')
  })

  it('covering rect references the pattern via fill, and the group is non-interactive', () => {
    const { container } = renderGrid()

    const pattern = container.querySelector('pattern')
    const patternId = pattern?.getAttribute('id')
    expect(patternId).toBeTruthy()

    const rect = container.querySelector('rect[fill^="url(#"]')
    expect(rect?.getAttribute('fill')).toBe(`url(#${String(patternId)})`)

    // pointer-events is set once on the group and inherited by the rect.
    const group = container.querySelector('g')
    expect(group?.getAttribute('pointer-events')).toBe('none')
  })
})
