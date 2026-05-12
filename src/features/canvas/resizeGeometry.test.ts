import { describe, expect, it } from 'vitest'

import type { Rect } from '@/lib/geometry/rect'

import { anchorForHandle, type HandlePosition, scaleFactors } from './resizeGeometry'

const bbox: Rect = { x: 10, y: 20, width: 100, height: 80 }

describe('anchorForHandle', () => {
  it('returns diametrically opposite point for each handle position', () => {
    expect(anchorForHandle('nw', bbox)).toEqual({ x: 110, y: 100 })
    expect(anchorForHandle('n', bbox)).toEqual({ x: 60, y: 100 })
    expect(anchorForHandle('ne', bbox)).toEqual({ x: 10, y: 100 })
    expect(anchorForHandle('e', bbox)).toEqual({ x: 10, y: 60 })
    expect(anchorForHandle('se', bbox)).toEqual({ x: 10, y: 20 })
    expect(anchorForHandle('s', bbox)).toEqual({ x: 60, y: 20 })
    expect(anchorForHandle('sw', bbox)).toEqual({ x: 110, y: 20 })
    expect(anchorForHandle('w', bbox)).toEqual({ x: 110, y: 60 })
  })

  it('handles zero-size bbox (all anchors collapse to the origin point)', () => {
    const zeroBbox: Rect = { x: 5, y: 5, width: 0, height: 0 }
    const positions: HandlePosition[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

    for (const pos of positions) {
      const anchor = anchorForHandle(pos, zeroBbox)
      expect(anchor.x).toBe(5)
      expect(anchor.y).toBe(5)
    }
  })

  it('works with negative coordinates', () => {
    const negBbox: Rect = { x: -20, y: -10, width: 40, height: 30 }
    expect(anchorForHandle('se', negBbox)).toEqual({ x: -20, y: -10 })
    expect(anchorForHandle('nw', negBbox)).toEqual({ x: 20, y: 20 })
  })
})

describe('scaleFactors', () => {
  const start = { x: 110, y: 100 }

  it('returns identity (1, 1) when pointer has not moved', () => {
    const result = scaleFactors('se', start, start, bbox)
    expect(result).toEqual({ sx: 1, sy: 1 })
  })

  describe('corner handles affect both axes', () => {
    it('se: positive drag increases both sx and sy', () => {
      const { sx, sy } = scaleFactors('se', start, { x: 160, y: 140 }, bbox)
      expect(sx).toBeCloseTo(1.5)
      expect(sy).toBeCloseTo(1.5)
    })

    it('nw: negative drag (away from bbox) increases both', () => {
      const nwStart = { x: 10, y: 20 }
      const { sx, sy } = scaleFactors('nw', nwStart, { x: -40, y: -20 }, bbox)
      expect(sx).toBeCloseTo(1.5)
      expect(sy).toBeCloseTo(1.5)
    })

    it('ne: mixed drag', () => {
      const neStart = { x: 110, y: 20 }
      const { sx, sy } = scaleFactors('ne', neStart, { x: 160, y: -20 }, bbox)
      expect(sx).toBeCloseTo(1.5)
      expect(sy).toBeCloseTo(1.5)
    })

    it('sw: mixed drag', () => {
      const swStart = { x: 10, y: 100 }
      const { sx, sy } = scaleFactors('sw', swStart, { x: -40, y: 140 }, bbox)
      expect(sx).toBeCloseTo(1.5)
      expect(sy).toBeCloseTo(1.5)
    })
  })

  describe('edge handles constrain to one axis', () => {
    it('e: only sx changes, sy stays 1', () => {
      const eStart = { x: 110, y: 60 }
      const { sx, sy } = scaleFactors('e', eStart, { x: 160, y: 80 }, bbox)
      expect(sx).toBeCloseTo(1.5)
      expect(sy).toBe(1)
    })

    it('w: only sx changes, sy stays 1', () => {
      const wStart = { x: 10, y: 60 }
      const { sx, sy } = scaleFactors('w', wStart, { x: -40, y: 60 }, bbox)
      expect(sx).toBeCloseTo(1.5)
      expect(sy).toBe(1)
    })

    it('n: only sy changes, sx stays 1', () => {
      const nStart = { x: 60, y: 20 }
      const { sx, sy } = scaleFactors('n', nStart, { x: 90, y: -20 }, bbox)
      expect(sx).toBe(1)
      expect(sy).toBeCloseTo(1.5)
    })

    it('s: only sy changes, sx stays 1', () => {
      const sStart = { x: 60, y: 100 }
      const { sx, sy } = scaleFactors('s', sStart, { x: 30, y: 140 }, bbox)
      expect(sx).toBe(1)
      expect(sy).toBeCloseTo(1.5)
    })
  })

  describe('drag toward anchor yields sx/sy < 1', () => {
    it('se: dragging inward shrinks', () => {
      const { sx, sy } = scaleFactors('se', start, { x: 60, y: 60 }, bbox)
      expect(sx).toBeCloseTo(0.5)
      expect(sy).toBeCloseTo(0.5)
    })

    it('se: dragging past anchor yields negative scale', () => {
      const { sx, sy } = scaleFactors('se', start, { x: -90, y: -60 }, bbox)
      expect(sx).toBeLessThan(0)
      expect(sy).toBeLessThan(0)
    })
  })

  describe('zero-size bbox guards', () => {
    it('sx stays 1 when bbox width is 0', () => {
      const zeroBbox: Rect = { x: 5, y: 5, width: 0, height: 80 }
      const { sx, sy } = scaleFactors('se', { x: 5, y: 85 }, { x: 55, y: 125 }, zeroBbox)
      expect(sx).toBe(1)
      expect(sy).toBeCloseTo(1.5)
    })

    it('sy stays 1 when bbox height is 0', () => {
      const zeroBbox: Rect = { x: 5, y: 5, width: 100, height: 0 }
      const { sx, sy } = scaleFactors('se', { x: 105, y: 5 }, { x: 155, y: 45 }, zeroBbox)
      expect(sx).toBeCloseTo(1.5)
      expect(sy).toBe(1)
    })

    it('both stay 1 when bbox is zero-size', () => {
      const zeroBbox: Rect = { x: 5, y: 5, width: 0, height: 0 }
      const { sx, sy } = scaleFactors('se', { x: 5, y: 5 }, { x: 50, y: 50 }, zeroBbox)
      expect(sx).toBe(1)
      expect(sy).toBe(1)
    })
  })

  describe('sign convention per handle', () => {
    it('left-side handles (nw, w, sw) invert dx sign', () => {
      const leftDrag = { x: -10, y: 0 }

      for (const pos of ['nw', 'w', 'sw'] as const) {
        const { sx } = scaleFactors(pos, { x: 0, y: 0 }, leftDrag, bbox)
        expect(sx).toBeGreaterThan(1)
      }
    })

    it('right-side handles (ne, e, se) use positive dx sign', () => {
      const rightDrag = { x: 10, y: 0 }

      for (const pos of ['ne', 'e', 'se'] as const) {
        const { sx } = scaleFactors(pos, { x: 0, y: 0 }, rightDrag, bbox)
        expect(sx).toBeGreaterThan(1)
      }
    })

    it('top handles (nw, n, ne) invert dy sign', () => {
      const upDrag = { x: 0, y: -10 }

      for (const pos of ['nw', 'n', 'ne'] as const) {
        const { sy } = scaleFactors(pos, { x: 0, y: 0 }, upDrag, bbox)
        expect(sy).toBeGreaterThan(1)
      }
    })

    it('bottom handles (sw, s, se) use positive dy sign', () => {
      const downDrag = { x: 0, y: 10 }

      for (const pos of ['sw', 's', 'se'] as const) {
        const { sy } = scaleFactors(pos, { x: 0, y: 0 }, downDrag, bbox)
        expect(sy).toBeGreaterThan(1)
      }
    })
  })
})
