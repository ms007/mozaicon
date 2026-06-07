import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { makeDoc, makeRect } from '@/test/fixtures/shapes'

import { exportSvg } from './pipeline'

function loadFixture(name: string) {
  return readFileSync(resolve(__dirname, '__fixtures__', name), 'utf-8').trim()
}

const baseRect = makeRect({ x: 2, y: 2, width: 20, height: 20 })

describe('exportSvg', () => {
  it('optimizes a plain rect', async () => {
    const doc = makeDoc([baseRect])
    expect(await exportSvg(doc)).toBe(loadFixture('optimized-plain-rect.svg'))
  })

  it('optimizes a rect with uniform radii', async () => {
    const doc = makeDoc([makeRect({ ...baseRect, radii: [4, 4, 4, 4] })])
    expect(await exportSvg(doc)).toBe(loadFixture('optimized-uniform-radii.svg'))
  })

  it('optimizes a rect with non-uniform radii', async () => {
    const doc = makeDoc([makeRect({ ...baseRect, radii: [1, 2, 3, 4] })])
    expect(await exportSvg(doc)).toBe(loadFixture('optimized-non-uniform-radii.svg'))
  })

  it('filters hidden shapes and optimizes the result', async () => {
    const doc = makeDoc([
      makeRect({ id: 'r1', name: 'Hidden', visible: false, width: 24, height: 24 }),
      makeRect({ id: 'r2', name: 'Visible', x: 10, y: 10, width: 4, height: 4, fill: '#f00' }),
    ])
    expect(await exportSvg(doc)).toBe(loadFixture('optimized-hidden-shape-filtered.svg'))
  })

  it('optimizes default fill', async () => {
    const doc = makeDoc([makeRect({ name: 'NoFill', width: 24, height: 24 })])
    expect(await exportSvg(doc)).toBe(loadFixture('optimized-fill-defaults.svg'))
  })

  it('preserves viewBox in optimized output', async () => {
    const doc = makeDoc([makeRect({ width: 24, height: 24 })])
    const output = await exportSvg(doc)
    expect(output).toContain('viewBox="0 0 24 24"')
  })

  it('root carries only viewBox and xmlns after optimization', async () => {
    const doc = makeDoc([makeRect({ width: 24, height: 24 })])
    const output = await exportSvg(doc)
    const svgTag = /<svg[^>]*>/.exec(output)?.[0] ?? ''
    expect(svgTag).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svgTag).toContain('viewBox="0 0 24 24"')
    expect(svgTag).not.toContain('width=')
    expect(svgTag).not.toContain('height=')
  })

  it('does not include shape names, ids, or titles', async () => {
    const doc = makeDoc([makeRect({ ...baseRect, name: 'My Shape' })])
    const output = await exportSvg(doc)
    expect(output).not.toContain('r1')
    expect(output).not.toContain('My Shape')
    expect(output).not.toContain('<title')
    expect(output).not.toContain('id=')
  })

  it('handles an empty document', async () => {
    const output = await exportSvg(makeDoc())
    expect(output).toContain('viewBox="0 0 24 24"')
    expect(output).toContain('xmlns="http://www.w3.org/2000/svg"')
  })
})
