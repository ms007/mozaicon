import { describe, expect, it } from 'vitest'

import type { Radii } from '@/types/shapes'

import { cornerPath } from './corner-path'

describe('cornerPath', () => {
  describe('zero-radius short-circuit', () => {
    it('produces a plain rect when all radii are zero', () => {
      const d = cornerPath(0, 0, 10, 8, [0, 0, 0, 0], 0)
      expect(d).toBe('M0 0H10V8H0Z')
    })

    it('produces a plain rect even with smoothing when all radii are zero', () => {
      const d = cornerPath(0, 0, 10, 8, [0, 0, 0, 0], 100)
      expect(d).toBe('M0 0H10V8H0Z')
    })
  })

  describe('smoothing 0 (rounded)', () => {
    it('generates arcs for uniform nonzero radii', () => {
      const d = cornerPath(0, 0, 20, 10, [3, 3, 3, 3], 0)
      expect(d).toContain('A3 3')
      expect(d).toMatch(/^M3 0/)
      expect(d).toMatch(/Z$/)
    })

    it('generates different arcs for each corner', () => {
      const d = cornerPath(0, 0, 20, 20, [1, 2, 3, 4], 0)
      expect(d).toContain('A1 1')
      expect(d).toContain('A2 2')
      expect(d).toContain('A3 3')
      expect(d).toContain('A4 4')
    })

    it('applies position offset', () => {
      const d = cornerPath(5, 10, 20, 20, [2, 2, 2, 2], 0)
      expect(d).toMatch(/^M7 10/)
    })

    it('clamps radii to half the smaller side', () => {
      const dClamped = cornerPath(0, 0, 10, 10, [100, 100, 100, 100], 0)
      const dMax = cornerPath(0, 0, 10, 10, [5, 5, 5, 5], 0)
      expect(dClamped).toBe(dMax)
    })

    it('omits arcs for zero-radius corners', () => {
      const d = cornerPath(0, 0, 20, 20, [0, 5, 0, 5], 0)
      const arcCount = (d.match(/A/g) ?? []).length
      expect(arcCount).toBe(2)
    })
  })

  describe('smoothing 100 (full squircle)', () => {
    it('uses cubic Bézier curves instead of arcs for uniform radii', () => {
      const d = cornerPath(0, 0, 20, 20, [5, 5, 5, 5], 100)
      expect(d).not.toContain('A')
      expect(d).toContain('C')
      expect(d).toMatch(/^M/)
      expect(d).toMatch(/Z$/)
    })

    it('uses cubic Béziers for per-corner radii', () => {
      const d = cornerPath(0, 0, 20, 20, [2, 4, 6, 3], 100)
      expect(d).not.toContain('A')
      expect(d).toContain('C')
    })

    it('still produces a plain rect when all radii are zero', () => {
      const d = cornerPath(0, 0, 10, 8, [0, 0, 0, 0], 100)
      expect(d).toBe('M0 0H10V8H0Z')
    })

    it('control points sit at the sharp corner vertices', () => {
      const d = cornerPath(0, 0, 20, 20, [5, 5, 5, 5], 100)
      // Top-right vertex (20,0): CPs pull toward (20,0), curve ends at (20,5)
      expect(d).toContain('C20 0 20 0 20 5')
      // Bottom-right vertex (20,20): CPs pull toward (20,20), curve ends at (15,20)
      expect(d).toContain('C20 20 20 20 15 20')
      // Bottom-left vertex (0,20): CPs pull toward (0,20), curve ends at (0,15)
      expect(d).toContain('C0 20 0 20 0 15')
      // Top-left vertex (0,0): CPs pull toward (0,0), curve ends at (5,0)
      expect(d).toContain('C0 0 0 0 5 0')
    })
  })

  describe('tangent continuity', () => {
    it('control points lie along adjacent edges, not diagonally', () => {
      const d = cornerPath(0, 0, 20, 20, [4, 4, 4, 4], 50)
      const cubics = d.match(/C[\d.]+ [\d.]+ [\d.]+ [\d.]+ [\d.]+ [\d.]+/g) ?? []
      expect(cubics).toHaveLength(4)
      // Top-right: CP1 on top edge (y=0), CP2 on right edge (x=20)
      expect(cubics[0]).toMatch(/^C[\d.]+ 0 20 [\d.]+/)
      // Bottom-right: CP1 on right edge (x=20), CP2 on bottom edge (y=20)
      expect(cubics[1]).toMatch(/^C20 [\d.]+ [\d.]+ 20/)
      // Bottom-left: CP1 on bottom edge (y=20), CP2 on left edge (x=0)
      expect(cubics[2]).toMatch(/^C[\d.]+ 20 0 [\d.]+/)
      // Top-left: CP1 on left edge (x=0), CP2 on top edge (y=0)
      expect(cubics[3]).toMatch(/^C0 [\d.]+ [\d.]+ 0/)
    })
  })

  describe('intermediate smoothing', () => {
    it('produces Bézier curves at smoothing 50', () => {
      const d = cornerPath(0, 0, 20, 20, [5, 5, 5, 5], 50)
      expect(d).not.toContain('A')
      expect(d).toContain('C')
    })

    it('produces a different path than smoothing 0 or 100', () => {
      const radii: Radii = [5, 5, 5, 5]
      const d0 = cornerPath(0, 0, 20, 20, radii, 0)
      const d50 = cornerPath(0, 0, 20, 20, radii, 50)
      const d100 = cornerPath(0, 0, 20, 20, radii, 100)
      expect(d50).not.toBe(d0)
      expect(d50).not.toBe(d100)
    })
  })

  describe('extreme-radius clamping', () => {
    it('clamps all radii to half the smaller side', () => {
      const d = cornerPath(0, 0, 10, 20, [100, 100, 100, 100], 0)
      const dMax = cornerPath(0, 0, 10, 20, [5, 5, 5, 5], 0)
      expect(d).toBe(dMax)
    })

    it('clamps individual radii independently', () => {
      const d = cornerPath(0, 0, 10, 10, [1, 20, 3, 20], 0)
      expect(d).toContain('A1 1')
      expect(d).toContain('A5 5')
      expect(d).toContain('A3 3')
    })

    it('clamps radii for smooth corners too', () => {
      const dClamped = cornerPath(0, 0, 10, 10, [100, 100, 100, 100], 100)
      const dMax = cornerPath(0, 0, 10, 10, [5, 5, 5, 5], 100)
      expect(dClamped).toBe(dMax)
    })
  })

  describe('smoothing clamping', () => {
    it('treats negative smoothing as 0', () => {
      const d = cornerPath(0, 0, 20, 20, [5, 5, 5, 5], -10)
      const d0 = cornerPath(0, 0, 20, 20, [5, 5, 5, 5], 0)
      expect(d).toBe(d0)
    })

    it('treats smoothing above 100 as 100', () => {
      const d = cornerPath(0, 0, 20, 20, [5, 5, 5, 5], 200)
      const d100 = cornerPath(0, 0, 20, 20, [5, 5, 5, 5], 100)
      expect(d).toBe(d100)
    })
  })

  describe('determinism', () => {
    it('produces identical output on repeated calls', () => {
      const a = cornerPath(0, 0, 24, 24, [4, 4, 4, 4], 60)
      const b = cornerPath(0, 0, 24, 24, [4, 4, 4, 4], 60)
      expect(a).toBe(b)
    })
  })

  describe('golden-file snapshots', () => {
    it('rounded uniform r=3 on 20×10', () => {
      expect(cornerPath(0, 0, 20, 10, [3, 3, 3, 3], 0)).toMatchInlineSnapshot(
        `"M3 0H17A3 3 0 0 1 20 3V7A3 3 0 0 1 17 10H3A3 3 0 0 1 0 7V3A3 3 0 0 1 3 0Z"`,
      )
    })

    it('rounded per-corner [1,2,3,4] on 20×20', () => {
      expect(cornerPath(0, 0, 20, 20, [1, 2, 3, 4], 0)).toMatchInlineSnapshot(
        `"M1 0H18A2 2 0 0 1 20 2V17A3 3 0 0 1 17 20H4A4 4 0 0 1 0 16V1A1 1 0 0 1 1 0Z"`,
      )
    })

    it('smooth uniform r=5 smoothing=100 on 20×20', () => {
      expect(cornerPath(0, 0, 20, 20, [5, 5, 5, 5], 100)).toMatchSnapshot()
    })

    it('smooth per-corner [2,4,6,3] smoothing=100 on 24×24', () => {
      expect(cornerPath(0, 0, 24, 24, [2, 4, 6, 3], 100)).toMatchSnapshot()
    })

    it('smooth uniform r=4 smoothing=50 on 20×20', () => {
      expect(cornerPath(0, 0, 20, 20, [4, 4, 4, 4], 50)).toMatchSnapshot()
    })
  })
})
