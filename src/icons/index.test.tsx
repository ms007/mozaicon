import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { cornerIcons, headerIcons, toolIcons, utilityIcons } from '@/icons'

function svg(container: HTMLElement) {
  const el = container.querySelector('svg')
  if (!el) throw new Error('SVG element not found')
  return el
}

describe('toolIcons catalog', () => {
  it('contains exactly 6 entries', () => {
    expect(toolIcons).toHaveLength(6)
  })

  it('contains the expected tool names in order', () => {
    const names = toolIcons.map((i) => i.name)
    expect(names).toEqual(['Draw', 'Erase', 'Line', 'Rect', 'Ellipse', 'Fill'])
  })

  it.each(toolIcons)('$name renders an SVG with strokeWidth 1.3', ({ component: C }) => {
    const { container } = render(<C />)
    const el = svg(container)
    expect(el.getAttribute('stroke-width')).toBe('1.3')
  })

  it.each(toolIcons)('$name forwards className to the SVG element', ({ component: C }) => {
    const { container } = render(<C className="custom-class" />)
    const el = svg(container)
    expect(el.getAttribute('class')).toContain('custom-class')
  })

  it.each(toolIcons)('$name allows strokeWidth override via props', ({ component: C }) => {
    const { container } = render(<C strokeWidth={2} />)
    const el = svg(container)
    expect(el.getAttribute('stroke-width')).toBe('2')
  })

  it.each(toolIcons)('$name renders at least one child SVG element', ({ component: C }) => {
    const { container } = render(<C />)
    const el = svg(container)
    expect(el.childElementCount).toBeGreaterThanOrEqual(1)
  })
})

describe('headerIcons catalog', () => {
  it('contains exactly 4 entries', () => {
    expect(headerIcons).toHaveLength(4)
  })

  it('contains the expected header names in order', () => {
    const names = headerIcons.map((i) => i.name)
    expect(names).toEqual(['Undo', 'Redo', 'Sun', 'Moon'])
  })

  it.each(headerIcons)('$name renders an SVG with strokeWidth 1.5', ({ component: C }) => {
    const { container } = render(<C />)
    const el = svg(container)
    expect(el.getAttribute('stroke-width')).toBe('1.5')
  })

  it.each(headerIcons)('$name forwards className to the SVG element', ({ component: C }) => {
    const { container } = render(<C className="test-class" />)
    const el = svg(container)
    expect(el.getAttribute('class')).toContain('test-class')
  })

  it.each(headerIcons)('$name allows strokeWidth override via props', ({ component: C }) => {
    const { container } = render(<C strokeWidth={2.5} />)
    const el = svg(container)
    expect(el.getAttribute('stroke-width')).toBe('2.5')
  })

  it.each(headerIcons)('$name renders at least one child SVG element', ({ component: C }) => {
    const { container } = render(<C />)
    const el = svg(container)
    expect(el.childElementCount).toBeGreaterThanOrEqual(1)
  })
})

describe('utilityIcons catalog', () => {
  it('contains exactly 2 entries', () => {
    expect(utilityIcons).toHaveLength(2)
  })

  it('contains the expected utility names in order', () => {
    const names = utilityIcons.map((i) => i.name)
    expect(names).toEqual(['Eye', 'EyeOff'])
  })

  it.each(utilityIcons)('$name renders an SVG with strokeWidth 1.3', ({ component: C }) => {
    const { container } = render(<C />)
    const el = svg(container)
    expect(el.getAttribute('stroke-width')).toBe('1.3')
  })

  it.each(utilityIcons)('$name forwards className to the SVG element', ({ component: C }) => {
    const { container } = render(<C className="custom-class" />)
    const el = svg(container)
    expect(el.getAttribute('class')).toContain('custom-class')
  })

  it.each(utilityIcons)('$name allows strokeWidth override via props', ({ component: C }) => {
    const { container } = render(<C strokeWidth={2} />)
    const el = svg(container)
    expect(el.getAttribute('stroke-width')).toBe('2')
  })

  it.each(utilityIcons)('$name renders at least one child SVG element', ({ component: C }) => {
    const { container } = render(<C />)
    const el = svg(container)
    expect(el.childElementCount).toBeGreaterThanOrEqual(1)
  })
})

describe('cornerIcons catalog', () => {
  it('contains exactly 5 entries', () => {
    expect(cornerIcons).toHaveLength(5)
  })

  it('contains the expected corner names in order', () => {
    const names = cornerIcons.map((i) => i.name)
    expect(names).toEqual([
      'CornersAll',
      'CornerTopLeft',
      'CornerTopRight',
      'CornerBottomRight',
      'CornerBottomLeft',
    ])
  })

  it.each(cornerIcons)('$name renders an SVG with strokeWidth 1.3', ({ component: C }) => {
    const { container } = render(<C />)
    const el = svg(container)
    expect(el.getAttribute('stroke-width')).toBe('1.3')
  })

  it.each(cornerIcons)('$name forwards className to the SVG element', ({ component: C }) => {
    const { container } = render(<C className="custom-class" />)
    const el = svg(container)
    expect(el.getAttribute('class')).toContain('custom-class')
  })

  it.each(cornerIcons)('$name renders at least one child SVG element', ({ component: C }) => {
    const { container } = render(<C />)
    const el = svg(container)
    expect(el.childElementCount).toBeGreaterThanOrEqual(1)
  })
})

describe('catalog arrays have unique names', () => {
  it('toolIcons names are unique', () => {
    const names = toolIcons.map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('headerIcons names are unique', () => {
    const names = headerIcons.map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('utilityIcons names are unique', () => {
    const names = utilityIcons.map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('cornerIcons names are unique', () => {
    const names = cornerIcons.map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('no name overlap between tool and header icons', () => {
    const toolNames = new Set<string>(toolIcons.map((i) => i.name))
    const headerNames = headerIcons.map((i) => i.name)
    for (const name of headerNames) {
      expect(toolNames.has(name)).toBe(false)
    }
  })

  it('no name overlap across all catalogs', () => {
    const allNames = [
      ...toolIcons.map((i) => i.name),
      ...headerIcons.map((i) => i.name),
      ...utilityIcons.map((i) => i.name),
      ...cornerIcons.map((i) => i.name),
    ]
    expect(new Set(allNames).size).toBe(allNames.length)
  })
})

describe('all icons share the 14×14 viewBox from the Icon wrapper', () => {
  const allIcons = [...toolIcons, ...headerIcons, ...utilityIcons, ...cornerIcons]

  it.each(allIcons)('$name has viewBox="0 0 14 14"', ({ component: C }) => {
    const { container } = render(<C />)
    const el = svg(container)
    expect(el.getAttribute('viewBox')).toBe('0 0 14 14')
  })

  it.each(allIcons)('$name inherits stroke="currentColor"', ({ component: C }) => {
    const { container } = render(<C />)
    const el = svg(container)
    expect(el.getAttribute('stroke')).toBe('currentColor')
  })

  it.each(allIcons)('$name inherits fill="none"', ({ component: C }) => {
    const { container } = render(<C />)
    const el = svg(container)
    expect(el.getAttribute('fill')).toBe('none')
  })
})
