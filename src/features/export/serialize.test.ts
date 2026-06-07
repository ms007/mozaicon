import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { makeDoc, makeRect } from '@/test/fixtures/shapes'
import type { Document, RectShape } from '@/types/shapes'

import { serializeDocument } from './serialize'

function loadFixture(name: string) {
  return readFileSync(resolve(__dirname, '__fixtures__', name), 'utf-8').trim()
}

const baseRect = makeRect({ name: 'R', width: 24, height: 24 })

function doc(...shapes: RectShape[]): Document {
  return makeDoc(shapes, { id: 'd1' })
}

describe('serializeDocument', () => {
  it('serializes an empty document', () => {
    expect(serializeDocument(doc())).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>',
    )
  })

  it('serializes a plain rect', () => {
    expect(serializeDocument(doc({ ...baseRect, x: 2, y: 2, width: 20, height: 20 }))).toBe(
      loadFixture('plain-rect.svg'),
    )
  })

  it('serializes a rect with uniform radii as rect with rx', () => {
    expect(
      serializeDocument(
        doc({ ...baseRect, x: 2, y: 2, width: 20, height: 20, radii: [4, 4, 4, 4] }),
      ),
    ).toBe(loadFixture('uniform-radii.svg'))
  })

  it('serializes a rect with non-uniform radii as path', () => {
    expect(
      serializeDocument(
        doc({ ...baseRect, x: 2, y: 2, width: 20, height: 20, radii: [1, 2, 3, 4] }),
      ),
    ).toBe(loadFixture('non-uniform-radii.svg'))
  })

  it('omits hidden shapes entirely', () => {
    expect(
      serializeDocument(
        doc(
          { ...baseRect, visible: false },
          { ...baseRect, id: 'r2', x: 10, y: 10, width: 4, height: 4, fill: '#f00' },
        ),
      ),
    ).toBe(loadFixture('hidden-shape-filtered.svg'))
  })

  it('writes default fill explicitly when fill is omitted', () => {
    expect(serializeDocument(doc(baseRect))).toBe(loadFixture('fill-defaults.svg'))
  })

  it('exports locked shapes normally', () => {
    expect(
      serializeDocument(doc({ ...baseRect, locked: true, x: 2, y: 2, width: 20, height: 20 })),
    ).toBe(loadFixture('plain-rect.svg'))
  })

  it('serializes stroke and stroke-width attributes', () => {
    const output = serializeDocument(
      doc({ ...baseRect, fill: '#fff', stroke: '#000', strokeWidth: 2 }),
    )
    expect(output).toContain('fill="#fff"')
    expect(output).toContain('stroke="#000"')
    expect(output).toContain('stroke-width="2"')
  })

  it('does not include shape names, ids, or titles', () => {
    const output = serializeDocument(
      doc({ ...baseRect, name: 'My Shape', x: 2, y: 2, width: 20, height: 20 }),
    )
    expect(output).not.toContain('r1')
    expect(output).not.toContain('My Shape')
    expect(output).not.toContain('<title')
    expect(output).not.toContain('id=')
  })

  it('escapes XML-special characters in fill attribute', () => {
    const output = serializeDocument(doc({ ...baseRect, fill: 'url(#a&b"c<d)' }))
    expect(output).toContain('fill="url(#a&amp;b&quot;c&lt;d)"')
  })

  it('preserves shape order for z-index fidelity', () => {
    const output = serializeDocument(
      doc({ ...baseRect, fill: '#aaa' }, { ...baseRect, id: 'r2', fill: '#bbb' }),
    )
    expect(output.indexOf('#aaa')).toBeLessThan(output.indexOf('#bbb'))
  })

  it('produces empty body when all shapes are hidden', () => {
    expect(serializeDocument(doc({ ...baseRect, visible: false }))).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>',
    )
  })

  it('root element carries only viewBox and xmlns', () => {
    const output = serializeDocument(doc(baseRect))
    const svgTag = /<svg[^>]*>/.exec(output)?.[0] ?? ''
    expect(svgTag).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svgTag).toContain('viewBox="0 0 24 24"')
    expect(svgTag).not.toContain('width=')
    expect(svgTag).not.toContain('height=')
  })
})
