import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { makeIcon, makeRect } from '@/test/fixtures/shapes'
import type { Icon, RectShape } from '@/types/shapes'

import { serializeIcon } from './serialize'

function loadFixture(name: string) {
  return readFileSync(resolve(__dirname, '__fixtures__', name), 'utf-8').trim()
}

const baseRect = makeRect({ name: 'R', width: 24, height: 24 })

function doc(...shapes: RectShape[]): Icon {
  return makeIcon(shapes, { id: 'd1' })
}

describe('serializeIcon', () => {
  it('serializes an empty document', () => {
    expect(serializeIcon(doc())).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>',
    )
  })

  it('serializes a plain rect', () => {
    expect(serializeIcon(doc({ ...baseRect, x: 2, y: 2, width: 20, height: 20 }))).toBe(
      loadFixture('plain-rect.svg'),
    )
  })

  it('serializes a rect with uniform radii as rect with rx', () => {
    expect(
      serializeIcon(
        doc({
          ...baseRect,
          x: 2,
          y: 2,
          width: 20,
          height: 20,
          corners: { ...DEFAULT_CORNERS, radii: [4, 4, 4, 4] },
        }),
      ),
    ).toBe(loadFixture('uniform-radii.svg'))
  })

  it('serializes a rect with non-uniform radii as path', () => {
    expect(
      serializeIcon(
        doc({
          ...baseRect,
          x: 2,
          y: 2,
          width: 20,
          height: 20,
          corners: { ...DEFAULT_CORNERS, radii: [1, 2, 3, 4] },
        }),
      ),
    ).toBe(loadFixture('non-uniform-radii.svg'))
  })

  it('omits hidden shapes entirely', () => {
    expect(
      serializeIcon(
        doc(
          { ...baseRect, visible: false },
          { ...baseRect, id: 'r2', x: 10, y: 10, width: 4, height: 4, fill: '#f00' },
        ),
      ),
    ).toBe(loadFixture('hidden-shape-filtered.svg'))
  })

  it('writes default fill explicitly when fill is omitted', () => {
    expect(serializeIcon(doc(baseRect))).toBe(loadFixture('fill-defaults.svg'))
  })

  it('exports locked shapes normally', () => {
    expect(
      serializeIcon(doc({ ...baseRect, locked: true, x: 2, y: 2, width: 20, height: 20 })),
    ).toBe(loadFixture('plain-rect.svg'))
  })

  it('serializes stroke and stroke-width attributes', () => {
    const output = serializeIcon(doc({ ...baseRect, fill: '#fff', stroke: '#000', strokeWidth: 2 }))
    expect(output).toContain('fill="#fff"')
    expect(output).toContain('stroke="#000"')
    expect(output).toContain('stroke-width="2"')
  })

  it('does not include shape names, ids, or titles', () => {
    const output = serializeIcon(
      doc({ ...baseRect, name: 'My Shape', x: 2, y: 2, width: 20, height: 20 }),
    )
    expect(output).not.toContain('r1')
    expect(output).not.toContain('My Shape')
    expect(output).not.toContain('<title')
    expect(output).not.toContain('id=')
  })

  it('escapes XML-special characters in fill attribute', () => {
    const output = serializeIcon(doc({ ...baseRect, fill: 'url(#a&b"c<d)' }))
    expect(output).toContain('fill="url(#a&amp;b&quot;c&lt;d)"')
  })

  it('preserves shape order for z-index fidelity', () => {
    const output = serializeIcon(
      doc({ ...baseRect, fill: '#aaa' }, { ...baseRect, id: 'r2', fill: '#bbb' }),
    )
    expect(output.indexOf('#aaa')).toBeLessThan(output.indexOf('#bbb'))
  })

  it('serializes a smoothed rect as path', () => {
    expect(
      serializeIcon(
        doc({
          ...baseRect,
          x: 2,
          y: 2,
          width: 20,
          height: 20,
          corners: { radii: [4, 4, 4, 4], style: 'smooth', smoothing: 60 },
        }),
      ),
    ).toBe(loadFixture('smooth-corners.svg'))
  })

  it('serializes a stroked rect with fill and stroke', () => {
    expect(
      serializeIcon(
        doc({
          ...baseRect,
          x: 2,
          y: 2,
          width: 20,
          height: 20,
          fill: '#fff',
          stroke: '#000',
          strokeWidth: 2,
        }),
      ),
    ).toBe(loadFixture('stroked-rect.svg'))
  })

  it('serializes a multi-shape icon with stroked rects', () => {
    expect(
      serializeIcon(
        doc(
          {
            ...baseRect,
            id: 'r1',
            x: 2,
            y: 2,
            width: 20,
            height: 20,
            fill: '#ff6600',
            stroke: '#333',
            strokeWidth: 1,
          },
          {
            ...baseRect,
            id: 'r2',
            x: 6,
            y: 6,
            width: 12,
            height: 12,
            fill: '#fff',
            stroke: '#000',
            strokeWidth: 2,
          },
        ),
      ),
    ).toBe(loadFixture('multi-shape-stroked.svg'))
  })

  it('produces empty body when all shapes are hidden', () => {
    expect(serializeIcon(doc({ ...baseRect, visible: false }))).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>',
    )
  })

  it('root element carries only viewBox and xmlns', () => {
    const output = serializeIcon(doc(baseRect))
    const svgTag = /<svg[^>]*>/.exec(output)?.[0] ?? ''
    expect(svgTag).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svgTag).toContain('viewBox="0 0 24 24"')
    expect(svgTag).not.toContain('width=')
    expect(svgTag).not.toContain('height=')
  })
})
