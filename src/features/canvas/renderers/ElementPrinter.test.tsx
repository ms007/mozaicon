import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ShapeElement } from '@/lib/svg/shapeElement'

import { ElementPrinter } from './ElementPrinter'

function renderElement(element: ShapeElement) {
  const { container } = render(
    <svg>
      <ElementPrinter element={element} />
    </svg>,
  )
  const svg = container.querySelector('svg')
  if (!svg) throw new Error('svg not found')
  return svg
}

describe('ElementPrinter', () => {
  it('renders a rect element with geometry and paint', () => {
    const svg = renderElement({
      tag: 'rect',
      attrs: { x: 0, y: 0, width: 20, height: 10, fill: '#000' },
    })
    const rect = svg.querySelector('rect')
    expect(rect).toBeTruthy()
    expect(rect?.getAttribute('x')).toBe('0')
    expect(rect?.getAttribute('width')).toBe('20')
    expect(rect?.getAttribute('fill')).toBe('#000')
  })

  it('renders a rect element with rx', () => {
    const svg = renderElement({
      tag: 'rect',
      attrs: { x: 0, y: 0, width: 20, height: 10, rx: 3, fill: '#000' },
    })
    const rect = svg.querySelector('rect')
    expect(rect).toBeTruthy()
    expect(rect?.getAttribute('rx')).toBe('3')
  })

  it('renders a path element with d and paint', () => {
    const svg = renderElement({
      tag: 'path',
      attrs: { d: 'M0 0L10 10', fill: '#f00' },
    })
    const path = svg.querySelector('path')
    expect(path).toBeTruthy()
    expect(path?.getAttribute('d')).toBe('M0 0L10 10')
    expect(path?.getAttribute('fill')).toBe('#f00')
  })

  it('renders stroke and strokeWidth', () => {
    const svg = renderElement({
      tag: 'rect',
      attrs: { x: 0, y: 0, width: 10, height: 10, fill: '#000', stroke: '#00f', strokeWidth: 2 },
    })
    const rect = svg.querySelector('rect')
    expect(rect?.getAttribute('stroke')).toBe('#00f')
    expect(rect?.getAttribute('stroke-width')).toBe('2')
  })

  it('omits undefined optional attributes', () => {
    const svg = renderElement({
      tag: 'rect',
      attrs: { x: 0, y: 0, width: 10, height: 10, fill: '#000' },
    })
    const rect = svg.querySelector('rect')
    expect(rect?.getAttribute('stroke')).toBeNull()
    expect(rect?.getAttribute('stroke-width')).toBeNull()
  })
})
