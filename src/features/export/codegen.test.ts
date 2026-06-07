import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { toPascalComponentName } from '@/lib/naming'
import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import type { Document, RectShape } from '@/types/shapes'

import { generateTsx } from './codegen'

function loadFixture(name: string) {
  return readFileSync(resolve(__dirname, '__fixtures__', name), 'utf-8')
}

const baseRect = makeRect({ name: 'R', x: 2, y: 2, width: 20, height: 20 })

function doc(name: string, ...shapes: RectShape[]): Document {
  return makeDoc(shapes, { id: 'd1', name })
}

describe('generateTsx', () => {
  it('generates a component for a plain rect', () => {
    const name = toPascalComponentName('My Icon')
    expect(generateTsx(doc('My Icon', baseRect), name)).toBe(
      loadFixture('component-plain-rect.tsx'),
    )
  })

  it('uses Icon fallback when document name is empty', () => {
    const name = toPascalComponentName('')
    expect(generateTsx(doc('', baseRect), name)).toBe(loadFixture('component-fallback-name.tsx'))
  })

  it('prefixes Icon for digit-starting names', () => {
    const name = toPascalComponentName('2x Arrow')
    expect(generateTsx(doc('2x Arrow', baseRect), name)).toBe(
      loadFixture('component-digit-prefix.tsx'),
    )
  })

  it('renders uniform radii as rect with rx', () => {
    const shape = { ...baseRect, radii: [4, 4, 4, 4] as [number, number, number, number] }
    const name = toPascalComponentName('My Icon')
    expect(generateTsx(doc('My Icon', shape), name)).toBe(
      loadFixture('component-uniform-radii.tsx'),
    )
  })

  it('renders non-uniform radii as path element', () => {
    const shape = { ...baseRect, radii: [1, 2, 3, 4] as [number, number, number, number] }
    const name = toPascalComponentName('Test')
    const output = generateTsx(doc('Test', shape), name)
    expect(output).toContain('<path d=')
    expect(output).not.toContain('<rect')
    expect(output).toContain('fill="#000"')
  })

  it('omits hidden shapes', () => {
    const hidden = { ...baseRect, visible: false }
    const visible: RectShape = {
      ...baseRect,
      id: 'r2',
      x: 10,
      y: 10,
      width: 4,
      height: 4,
      fill: '#f00',
    }
    const name = toPascalComponentName('My Icon')
    expect(generateTsx(doc('My Icon', hidden, visible), name)).toBe(
      loadFixture('component-hidden-shapes.tsx'),
    )
  })

  it('generates empty body when no shapes', () => {
    const name = toPascalComponentName('My Icon')
    expect(generateTsx(doc('My Icon'), name)).toBe(loadFixture('component-empty.tsx'))
  })

  it('keeps colors literal — no currentColor rewrite', () => {
    const shape = { ...baseRect, fill: '#ff6600' }
    const name = toPascalComponentName('Test')
    const output = generateTsx(doc('Test', shape), name)
    expect(output).toContain('#ff6600')
    expect(output).not.toContain('currentColor')
  })

  it('uses camelCase for multi-word SVG attributes', () => {
    const shape = { ...baseRect, fill: '#fff', stroke: '#000', strokeWidth: 2 }
    const name = toPascalComponentName('Test')
    const output = generateTsx(doc('Test', shape), name)
    expect(output).toContain('strokeWidth={2}')
    expect(output).not.toContain('stroke-width')
  })

  it('exports a named function, not default', () => {
    const name = toPascalComponentName('Arrow')
    const output = generateTsx(doc('Arrow', baseRect), name)
    expect(output).toContain('export function Arrow')
    expect(output).not.toContain('export default')
  })

  it('includes SVGProps type import', () => {
    const name = toPascalComponentName('Test')
    const output = generateTsx(doc('Test', baseRect), name)
    expect(output).toContain("import type { SVGProps } from 'react'")
  })

  it('spreads props last on the svg element', () => {
    const name = toPascalComponentName('Test')
    const output = generateTsx(doc('Test', baseRect), name)
    const svgLine = output.split('\n').find((l) => l.includes('<svg')) ?? ''
    const propsIdx = svgLine.indexOf('{...props}')
    const closingIdx = svgLine.indexOf('>')
    expect(propsIdx).toBeGreaterThan(0)
    expect(propsIdx).toBeLessThan(closingIdx)
  })

  it('sets width and height to viewBox dimensions', () => {
    const name = toPascalComponentName('Test')
    const output = generateTsx(doc('Test', baseRect), name)
    expect(output).toContain('width={24}')
    expect(output).toContain('height={24}')
  })

  it('does not include shape names, ids, or editor metadata', () => {
    const shape = { ...baseRect, name: 'My Shape' }
    const name = toPascalComponentName('Test')
    const output = generateTsx(doc('Test', shape), name)
    expect(output).not.toContain('r1')
    expect(output).not.toContain('My Shape')
    expect(output).not.toContain('id=')
  })

  it('escapes quotes and ampersands in string attribute values', () => {
    const shape = { ...baseRect, fill: 'url(#a&b"c)' }
    const name = toPascalComponentName('Test')
    const output = generateTsx(doc('Test', shape), name)
    expect(output).toContain('fill="url(#a&amp;b&quot;c)"')
    expect(output).not.toContain('fill="url(#a&b"c)"')
  })
})
