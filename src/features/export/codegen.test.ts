import { describe, expect, it } from 'vitest'

import { generateTsx } from './codegen'

function svgWith(children: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${children}</svg>`
}

describe('generateTsx', () => {
  it('prints numeric attributes in braces and strings in quotes', () => {
    const output = generateTsx(svgWith('<rect width="20" height="20" fill="red"/>'), 'Test')
    expect(output).toContain('<rect width={20} height={20} fill="red" />')
  })

  it('camelCases kebab-case attributes', () => {
    const output = generateTsx(
      svgWith('<rect width="20" height="20" stroke="#000" stroke-width="2"/>'),
      'Test',
    )
    expect(output).toContain('strokeWidth={2}')
    expect(output).not.toContain('stroke-width')
  })

  it('escapes quotes and ampersands in string attribute values', () => {
    const output = generateTsx(svgWith('<rect fill="url(#a&amp;b&quot;c)"/>'), 'Test')
    expect(output).toContain('fill="url(#a&amp;b&quot;c)"')
    expect(output).not.toContain('fill="url(#a&b"c)"')
  })

  it('prints nested elements with indentation', () => {
    const output = generateTsx(svgWith('<g fill="red"><rect width="4" height="4"/></g>'), 'Test')
    expect(output).toContain(
      '      <g fill="red">\n        <rect width={4} height={4} />\n      </g>',
    )
  })

  it('exports a named function, not default', () => {
    const output = generateTsx(svgWith('<rect width="4" height="4"/>'), 'Arrow')
    expect(output).toContain('export function Arrow')
    expect(output).not.toContain('export default')
  })

  it('includes SVGProps type import', () => {
    const output = generateTsx(svgWith('<rect width="4" height="4"/>'), 'Test')
    expect(output).toContain("import type { SVGProps } from 'react'")
  })

  it('spreads props last on the svg element', () => {
    const output = generateTsx(svgWith('<rect width="4" height="4"/>'), 'Test')
    const svgLine = output.split('\n').find((l) => l.includes('<svg')) ?? ''
    const propsIdx = svgLine.indexOf('{...props}')
    const closingIdx = svgLine.indexOf('>')
    expect(propsIdx).toBeGreaterThan(0)
    expect(propsIdx).toBeLessThan(closingIdx)
  })

  it('sets width and height to viewBox dimensions', () => {
    const output = generateTsx(svgWith('<rect width="4" height="4"/>'), 'Test')
    expect(output).toContain('width={24}')
    expect(output).toContain('height={24}')
  })

  it('throws on non-SVG input', () => {
    expect(() => generateTsx('<div>nope</div>', 'Test')).toThrow()
  })
})
