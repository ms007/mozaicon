import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import { toPascalComponentName } from '@/lib/naming'
import { makeIcon, makeRect } from '@/test/fixtures/shapes'
import type { Icon, RectShape } from '@/types/shapes'

import { exportSvg, exportTsx } from './pipeline'

function loadFixture(name: string) {
  return readFileSync(resolve(__dirname, '__fixtures__', name), 'utf-8').trim()
}

const baseRect = makeRect({ x: 2, y: 2, width: 20, height: 20 })

describe('exportSvg', () => {
  it('optimizes a plain rect', async () => {
    const doc = makeIcon([baseRect])
    expect(await exportSvg(doc)).toBe(loadFixture('optimized-plain-rect.svg'))
  })

  it('optimizes a rect with uniform radii', async () => {
    const doc = makeIcon([
      makeRect({ ...baseRect, corners: { ...DEFAULT_CORNERS, radii: [4, 4, 4, 4] } }),
    ])
    expect(await exportSvg(doc)).toBe(loadFixture('optimized-uniform-radii.svg'))
  })

  it('optimizes a rect with non-uniform radii', async () => {
    const doc = makeIcon([
      makeRect({ ...baseRect, corners: { ...DEFAULT_CORNERS, radii: [1, 2, 3, 4] } }),
    ])
    expect(await exportSvg(doc)).toBe(loadFixture('optimized-non-uniform-radii.svg'))
  })

  it('filters hidden shapes and optimizes the result', async () => {
    const doc = makeIcon([
      makeRect({ id: 'r1', name: 'Hidden', visible: false, width: 24, height: 24 }),
      makeRect({ id: 'r2', name: 'Visible', x: 10, y: 10, width: 4, height: 4, fill: '#f00' }),
    ])
    expect(await exportSvg(doc)).toBe(loadFixture('optimized-hidden-shape-filtered.svg'))
  })

  it('optimizes default fill', async () => {
    const doc = makeIcon([makeRect({ name: 'NoFill', width: 24, height: 24 })])
    expect(await exportSvg(doc)).toBe(loadFixture('optimized-fill-defaults.svg'))
  })

  it('preserves viewBox in optimized output', async () => {
    const doc = makeIcon([makeRect({ width: 24, height: 24 })])
    const output = await exportSvg(doc)
    expect(output).toContain('viewBox="0 0 24 24"')
  })

  it('root carries only viewBox and xmlns after optimization', async () => {
    const doc = makeIcon([makeRect({ width: 24, height: 24 })])
    const output = await exportSvg(doc)
    const svgTag = /<svg[^>]*>/.exec(output)?.[0] ?? ''
    expect(svgTag).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svgTag).toContain('viewBox="0 0 24 24"')
    expect(svgTag).not.toContain('width=')
    expect(svgTag).not.toContain('height=')
  })

  it('does not include shape names, ids, or titles', async () => {
    const doc = makeIcon([makeRect({ ...baseRect, name: 'My Shape' })])
    const output = await exportSvg(doc)
    expect(output).not.toContain('r1')
    expect(output).not.toContain('My Shape')
    expect(output).not.toContain('<title')
    expect(output).not.toContain('id=')
  })

  it('optimizes a smoothed rect', async () => {
    const doc = makeIcon([
      makeRect({
        ...baseRect,
        corners: { radii: [4, 4, 4, 4], style: 'smooth', smoothing: 60 },
      }),
    ])
    expect(await exportSvg(doc)).toBe(loadFixture('optimized-smooth-corners.svg'))
  })

  it('handles an empty document', async () => {
    const output = await exportSvg(makeIcon())
    expect(output).toContain('viewBox="0 0 24 24"')
    expect(output).toContain('xmlns="http://www.w3.org/2000/svg"')
  })
})

describe('exportTsx', () => {
  function namedDoc(name: string, ...shapes: RectShape[]): Icon {
    return makeIcon(shapes, { id: 'd1', name })
  }

  function exportNamed(doc: Icon): Promise<string> {
    return exportTsx(doc, toPascalComponentName(doc.name))
  }

  it('generates a component for a plain rect', async () => {
    expect(await exportNamed(namedDoc('My Icon', baseRect))).toBe(
      loadFixture('component-plain-rect.tsx') + '\n',
    )
  })

  it('uses Icon fallback when document name is empty', async () => {
    expect(await exportNamed(namedDoc('', baseRect))).toBe(
      loadFixture('component-fallback-name.tsx') + '\n',
    )
  })

  it('prefixes Icon for digit-starting names', async () => {
    expect(await exportNamed(namedDoc('2x Arrow', baseRect))).toBe(
      loadFixture('component-digit-prefix.tsx') + '\n',
    )
  })

  it('renders uniform radii as rect with rx', async () => {
    const shape = makeRect({
      ...baseRect,
      corners: { ...DEFAULT_CORNERS, radii: [4, 4, 4, 4] },
    })
    expect(await exportNamed(namedDoc('My Icon', shape))).toBe(
      loadFixture('component-uniform-radii.tsx') + '\n',
    )
  })

  it('renders non-uniform radii as path element', async () => {
    const shape = makeRect({
      ...baseRect,
      corners: { ...DEFAULT_CORNERS, radii: [1, 2, 3, 4] },
    })
    const output = await exportNamed(namedDoc('Test', shape))
    expect(output).toContain('<path d=')
    expect(output).not.toContain('<rect')
  })

  it('omits hidden shapes', async () => {
    const hidden = makeRect({ ...baseRect, visible: false })
    const visible = makeRect({
      ...baseRect,
      id: 'r2',
      x: 10,
      y: 10,
      width: 4,
      height: 4,
      fill: '#f00',
    })
    expect(await exportNamed(namedDoc('My Icon', hidden, visible))).toBe(
      loadFixture('component-hidden-shapes.tsx') + '\n',
    )
  })

  it('generates empty body when no shapes', async () => {
    expect(await exportNamed(namedDoc('My Icon'))).toBe(loadFixture('component-empty.tsx') + '\n')
  })

  it('keeps colors literal — no currentColor rewrite', async () => {
    const shape = makeRect({ ...baseRect, fill: '#ff6600' })
    const output = await exportNamed(namedDoc('Test', shape))
    expect(output).toContain('fill=')
    expect(output).not.toContain('currentColor')
  })

  it('matches the optimized SVG structurally', async () => {
    const doc = makeIcon([baseRect])
    const svg = await exportSvg(doc)
    const tsx = await exportTsx(doc, 'Test')
    const svgRect = /<rect[^/]*/.exec(svg)?.[0] ?? ''
    const tsxRect = /<rect[^/]*/.exec(tsx)?.[0] ?? ''
    expect(tsxRect.replace(/=\{(\d+)\}/g, '="$1"').trimEnd()).toBe(svgRect.trimEnd())
  })

  it('smoothed rect uses same path element in SVG and TSX exports', async () => {
    const shape = makeRect({
      ...baseRect,
      corners: { radii: [4, 4, 4, 4], style: 'smooth', smoothing: 60 },
    })
    const doc = makeIcon([shape])
    const svg = await exportSvg(doc)
    const tsx = await exportTsx(doc, 'Test')
    const svgPath = /<path[^/]*/.exec(svg)?.[0] ?? ''
    const tsxPath = /<path[^/]*/.exec(tsx)?.[0] ?? ''
    expect(svgPath).toContain('d=')
    expect(tsxPath).toContain('d=')
    expect(tsxPath.trimEnd()).toBe(svgPath.trimEnd())
  })

  it('renders a smoothed rect as path', async () => {
    const shape = makeRect({
      ...baseRect,
      corners: { radii: [4, 4, 4, 4], style: 'smooth', smoothing: 60 },
    })
    expect(await exportNamed(namedDoc('My Icon', shape))).toBe(
      loadFixture('component-smooth-corners.tsx') + '\n',
    )
  })

  it('does not include shape names, ids, or editor metadata', async () => {
    const shape = makeRect({ ...baseRect, name: 'My Shape' })
    const output = await exportNamed(namedDoc('Test', shape))
    expect(output).not.toContain('r1')
    expect(output).not.toContain('My Shape')
    expect(output).not.toContain('id=')
  })
})
