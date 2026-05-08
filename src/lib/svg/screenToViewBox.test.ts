import { describe, expect, it, vi } from 'vitest'

import { screenToViewBox } from './screenToViewBox'

function makeSvg(ctm: DOMMatrix | null): SVGSVGElement {
  return { getScreenCTM: vi.fn(() => ctm) } as unknown as SVGSVGElement
}

describe('screenToViewBox', () => {
  it('falls back to raw client coords when getScreenCTM returns null', () => {
    const svg = makeSvg(null)
    expect(screenToViewBox(svg, 42, 99)).toEqual({ x: 42, y: 99 })
  })

  it('applies the inverse CTM to map screen coords to viewBox', () => {
    // A 2× scale + 10px offset: viewBox coord = (screen - 10) / 2
    const ctm = new DOMMatrix([2, 0, 0, 2, 10, 20])
    const svg = makeSvg(ctm)

    const result = screenToViewBox(svg, 30, 40)
    expect(result.x).toBeCloseTo(10)
    expect(result.y).toBeCloseTo(10)
  })

  it('handles identity CTM (1:1 mapping)', () => {
    const ctm = new DOMMatrix()
    const svg = makeSvg(ctm)

    expect(screenToViewBox(svg, 5, 7)).toEqual({ x: 5, y: 7 })
  })

  it('handles non-uniform scaling', () => {
    // scaleX=4, scaleY=2, no translation
    const ctm = new DOMMatrix([4, 0, 0, 2, 0, 0])
    const svg = makeSvg(ctm)

    const result = screenToViewBox(svg, 20, 10)
    expect(result.x).toBeCloseTo(5)
    expect(result.y).toBeCloseTo(5)
  })
})
