import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { RectShape } from '@/types/shapes'

import { RectRenderer } from './RectRenderer'

const base: RectShape = {
  id: 'r1',
  name: 'Rect',
  type: 'rect',
  visible: true,
  locked: false,
  x: 0,
  y: 0,
  width: 20,
  height: 10,
}

function renderSvg(shape: RectShape) {
  const { container } = render(
    <svg>
      <RectRenderer shape={shape} />
    </svg>,
  )
  const svg = container.querySelector('svg')
  if (!svg) throw new Error('svg not found')
  return svg
}

describe('RectRenderer', () => {
  it('renders a plain rect without rx', () => {
    const svg = renderSvg(base)
    const rect = svg.querySelector('rect')
    expect(rect).toBeTruthy()
    expect(rect?.getAttribute('x')).toBe('0')
    expect(rect?.getAttribute('width')).toBe('20')
    expect(rect?.getAttribute('fill')).toBe('#000')
  })

  it('renders a native <rect> with uniform rx', () => {
    const svg = renderSvg({ ...base, rx: 3 })
    const rect = svg.querySelector('rect')
    expect(rect).toBeTruthy()
    expect(rect?.getAttribute('rx')).toBe('3')
  })

  it('renders a native <rect> with uniform radii tuple', () => {
    const svg = renderSvg({ ...base, radii: [4, 4, 4, 4] })
    const rect = svg.querySelector('rect')
    expect(rect).toBeTruthy()
    expect(rect?.getAttribute('rx')).toBe('4')
    expect(svg.querySelector('path')).toBeNull()
  })

  it('renders a <path> with differing per-corner radii', () => {
    const svg = renderSvg({ ...base, radii: [1, 2, 3, 4] })
    const path = svg.querySelector('path')
    expect(path).toBeTruthy()
    expect(svg.querySelector('rect')).toBeNull()
    const d = path?.getAttribute('d') ?? ''
    expect(d).toContain('A1 1')
    expect(d).toContain('A2 2')
    expect(d).toContain('A3 3')
    expect(d).toContain('A4 4')
  })

  it('renders stroke and stroke-width when stroked', () => {
    const svg = renderSvg({ ...base, stroke: '#00f', strokeWidth: 2 })
    const rect = svg.querySelector('rect')
    expect(rect?.getAttribute('stroke')).toBe('#00f')
    expect(rect?.getAttribute('stroke-width')).toBe('2')
  })

  it('omits stroke attributes when stroke is none', () => {
    const svg = renderSvg({ ...base, stroke: 'none', strokeWidth: 2 })
    const rect = svg.querySelector('rect')
    expect(rect?.getAttribute('stroke')).toBeNull()
    expect(rect?.getAttribute('stroke-width')).toBeNull()
  })

  it('clamps oversized radii in path mode', () => {
    const svg = renderSvg({ ...base, radii: [100, 100, 100, 0] })
    const path = svg.querySelector('path')
    expect(path).toBeTruthy()
    const d = path?.getAttribute('d') ?? ''
    expect(d).toContain('A5 5')
    expect(d).not.toContain('A100 100')
  })
})
