import { describe, expect, it } from 'vitest'

import { optimizeSvg } from './optimize'

describe('optimizeSvg', () => {
  it('preserves viewBox in optimized output', async () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" fill="#000"/></svg>'
    const result = await optimizeSvg(input)
    expect(result).toContain('viewBox="0 0 24 24"')
  })

  it('root carries only viewBox and xmlns', async () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" fill="#000"/></svg>'
    const result = await optimizeSvg(input)
    const svgTag = /<svg[^>]*>/.exec(result)?.[0] ?? ''
    expect(svgTag).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(svgTag).toContain('viewBox="0 0 24 24"')
    expect(svgTag).not.toContain('width=')
    expect(svgTag).not.toContain('height=')
  })

  it('strips default fill (#000 / black)', async () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" fill="#000"/></svg>'
    const result = await optimizeSvg(input)
    expect(result).not.toContain('fill=')
  })

  it('handles empty SVG', async () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>'
    const result = await optimizeSvg(input)
    expect(result).toContain('viewBox="0 0 24 24"')
  })
})
