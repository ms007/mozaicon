import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { RectShape } from '@/types/shapes'

import { LayerThumbnail } from './LayerThumbnail'

const rect: RectShape = {
  id: 'r1',
  name: 'Rect 1',
  visible: true,
  locked: false,
  type: 'rect',
  x: 2,
  y: 3,
  width: 10,
  height: 8,
  rx: 2,
}

function querySvg(container: HTMLElement) {
  const svg = container.querySelector('svg')
  if (!svg) throw new Error('svg not found')
  return svg
}

describe('LayerThumbnail', () => {
  it('renders a fitted svg with preserveAspectRatio', () => {
    const { container } = render(<LayerThumbnail shape={rect} />)
    const svg = querySvg(container)
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet')
    expect(svg.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders a rect silhouette with currentColor fill', () => {
    const { container } = render(<LayerThumbnail shape={rect} />)
    const rectEl = container.querySelector('rect')
    expect(rectEl).toBeTruthy()
    expect(rectEl?.getAttribute('fill')).toBe('currentColor')
    expect(rectEl?.getAttribute('rx')).toBe('2')
  })

  it('pads the viewBox around the shape bbox', () => {
    const { container } = render(<LayerThumbnail shape={rect} />)
    const svg = querySvg(container)
    expect(svg.getAttribute('viewBox')).toBe('1 2 12 10')
  })

  it('renders a rect with uniform radii tuple as <rect>', () => {
    const shape: RectShape = { ...rect, radii: [3, 3, 3, 3] }
    const { container } = render(<LayerThumbnail shape={shape} />)
    const rectEl = container.querySelector('rect')
    expect(rectEl).toBeTruthy()
    expect(rectEl?.getAttribute('rx')).toBe('3')
  })

  it('renders a path for per-corner radii', () => {
    const shape: RectShape = { ...rect, radii: [1, 2, 3, 4] }
    const { container } = render(<LayerThumbnail shape={shape} />)
    const path = container.querySelector('path')
    expect(path).toBeTruthy()
    expect(path?.getAttribute('fill')).toBe('currentColor')
    expect(container.querySelector('rect')).toBeNull()
  })
})
