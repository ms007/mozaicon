import { describe, expect, it } from 'vitest'

import { DEFAULT_CORNERS } from '@/lib/geometry/corner-radius'
import type { Rect } from '@/lib/geometry/rect'
import type { RectShape } from '@/types/shapes'

import { anchorForHandle, type HandlePosition } from './resizeGeometry'
import { computeResizeDraft } from './useResizeGesture'

const rect: RectShape = {
  id: 'r1',
  type: 'rect',
  name: 'Rect',
  visible: true,
  locked: false,
  x: 0,
  y: 0,
  width: 100,
  height: 50,
  corners: DEFAULT_CORNERS,
}

const bbox: Rect = { x: 0, y: 0, width: 100, height: 50 }
const noMod = { shift: false, alt: false }

function anchorFor(handle: HandlePosition, b: Rect = bbox) {
  return anchorForHandle(handle, b)
}

function draftRect(draft: Record<string, unknown>) {
  return draft.r1 as { x: number; y: number; width: number; height: number }
}

describe('computeResizeDraft', () => {
  describe('no modifiers', () => {
    it('scales from corner handle', () => {
      const start = { x: 100, y: 50 }
      const current = { x: 130, y: 70 }
      const draft = computeResizeDraft('se', start, current, bbox, anchorFor('se'), [rect], noMod)

      expect(draft.r1).toEqual({ x: 0, y: 0, width: 130, height: 70 })
    })

    it('scales from edge handle (horizontal only)', () => {
      const start = { x: 100, y: 25 }
      const current = { x: 120, y: 30 }
      const draft = computeResizeDraft('e', start, current, bbox, anchorFor('e'), [rect], noMod)

      expect(draft.r1).toMatchObject({ width: 120, height: 50 })
    })
  })

  describe('Shift (aspect-lock)', () => {
    it('locks aspect ratio on corner drag', () => {
      const start = { x: 100, y: 50 }
      const current = { x: 150, y: 60 }
      const draft = computeResizeDraft('se', start, current, bbox, anchorFor('se'), [rect], {
        shift: true,
        alt: false,
      })

      const r = draftRect(draft)
      const origRatio = bbox.width / bbox.height
      expect(r.width / r.height).toBeCloseTo(origRatio, 10)
    })

    it('picks the axis with the larger scale change', () => {
      const start = { x: 100, y: 50 }
      const current = { x: 200, y: 55 }
      const draft = computeResizeDraft('se', start, current, bbox, anchorFor('se'), [rect], {
        shift: true,
        alt: false,
      })

      const r = draftRect(draft)
      expect(r.width).toBe(200)
      expect(r.height).toBe(100)
    })

    it('is ignored on edge handles', () => {
      const start = { x: 100, y: 25 }
      const current = { x: 130, y: 30 }
      const withShift = computeResizeDraft('e', start, current, bbox, anchorFor('e'), [rect], {
        shift: true,
        alt: false,
      })
      const withoutShift = computeResizeDraft(
        'e',
        start,
        current,
        bbox,
        anchorFor('e'),
        [rect],
        noMod,
      )

      expect(withShift.r1).toEqual(withoutShift.r1)
    })
  })

  describe('Alt (center anchor)', () => {
    it('scales from bbox center — both sides grow', () => {
      const start = { x: 100, y: 50 }
      const current = { x: 120, y: 60 }
      const draft = computeResizeDraft('se', start, current, bbox, anchorFor('se'), [rect], {
        shift: false,
        alt: true,
      })

      const r = draftRect(draft)
      expect(r.width).toBe(140)
      expect(r.height).toBe(70)
      expect(r.x).toBe(-20)
      expect(r.y).toBe(-10)
    })

    it('works on edge handles', () => {
      const start = { x: 100, y: 25 }
      const current = { x: 110, y: 25 }
      const draft = computeResizeDraft('e', start, current, bbox, anchorFor('e'), [rect], {
        shift: false,
        alt: true,
      })

      const r = draftRect(draft)
      expect(r.width).toBe(120)
      expect(r.x).toBe(-10)
      expect(r.height).toBe(50)
    })
  })

  describe('Shift + Alt (proportional from center)', () => {
    it('locks aspect ratio and anchors at center', () => {
      const start = { x: 100, y: 50 }
      const current = { x: 150, y: 55 }
      const draft = computeResizeDraft('se', start, current, bbox, anchorFor('se'), [rect], {
        shift: true,
        alt: true,
      })

      const r = draftRect(draft)
      const origRatio = bbox.width / bbox.height
      expect(r.width / r.height).toBeCloseTo(origRatio, 10)
      const cx = r.x + r.width / 2
      const cy = r.y + r.height / 2
      expect(cx).toBeCloseTo(50, 10)
      expect(cy).toBeCloseTo(25, 10)
    })
  })

  describe('mirror (negative scale)', () => {
    it('mirrors when dragged past anchor on corner', () => {
      const start = { x: 100, y: 50 }
      const current = { x: -20, y: -10 }
      const draft = computeResizeDraft('se', start, current, bbox, anchorFor('se'), [rect], noMod)

      const r = draftRect(draft)
      expect(r.width).toBe(20)
      expect(r.height).toBe(10)
      expect(r.x).toBe(-20)
      expect(r.y).toBe(-10)
    })

    it('mirrors on a single axis when dragged past on edge', () => {
      const start = { x: 100, y: 25 }
      const current = { x: -20, y: 25 }
      const draft = computeResizeDraft('e', start, current, bbox, anchorFor('e'), [rect], noMod)

      const r = draftRect(draft)
      expect(r.width).toBe(20)
      expect(r.x).toBe(-20)
      expect(r.height).toBe(50)
      expect(r.y).toBe(0)
    })

    it('preserves mirror direction under Shift aspect-lock', () => {
      const start = { x: 100, y: 50 }
      const current = { x: -50, y: -20 }
      const draft = computeResizeDraft('se', start, current, bbox, anchorFor('se'), [rect], {
        shift: true,
        alt: false,
      })

      const r = draftRect(draft)
      expect(r.x).toBeLessThan(0)
      expect(r.y).toBeLessThan(0)
      const origRatio = bbox.width / bbox.height
      expect(r.width / r.height).toBeCloseTo(origRatio, 10)
    })
  })

  describe('other handle directions', () => {
    it('scales from NW corner (both negative sign axes)', () => {
      const start = { x: 0, y: 0 }
      const current = { x: -20, y: -10 }
      const draft = computeResizeDraft('nw', start, current, bbox, anchorFor('nw'), [rect], noMod)

      expect(draftRect(draft)).toEqual({ x: -20, y: -10, width: 120, height: 60 })
    })

    it('scales vertically only from S edge handle', () => {
      const start = { x: 50, y: 50 }
      const current = { x: 60, y: 70 }
      const draft = computeResizeDraft('s', start, current, bbox, anchorFor('s'), [rect], noMod)

      expect(draftRect(draft)).toEqual({ x: 0, y: 0, width: 100, height: 70 })
    })

    it('scales horizontally with negative sign from W edge handle', () => {
      const start = { x: 0, y: 25 }
      const current = { x: -10, y: 25 }
      const draft = computeResizeDraft('w', start, current, bbox, anchorFor('w'), [rect], noMod)

      const r = draftRect(draft)
      expect(r.x).toBeCloseTo(-10)
      expect(r.y).toBe(0)
      expect(r.width).toBeCloseTo(110)
      expect(r.height).toBe(50)
    })
  })

  describe('multi-shape', () => {
    it('scales each shape independently from the same anchor', () => {
      const rect2: RectShape = { ...rect, id: 'r2', x: 20, y: 10, width: 30, height: 20 }
      const start = { x: 100, y: 50 }
      const current = { x: 150, y: 75 }
      const draft = computeResizeDraft(
        'se',
        start,
        current,
        bbox,
        anchorFor('se'),
        [rect, rect2],
        noMod,
      )

      expect(Object.keys(draft)).toHaveLength(2)
      expect(draft.r1).toEqual({ x: 0, y: 0, width: 150, height: 75 })
      expect(draft.r2).toEqual({ x: 30, y: 15, width: 45, height: 30 })
    })
  })

  describe('edge cases', () => {
    it('returns empty record for empty shapes array', () => {
      const start = { x: 100, y: 50 }
      const current = { x: 150, y: 75 }
      const draft = computeResizeDraft('se', start, current, bbox, anchorFor('se'), [], noMod)

      expect(draft).toEqual({})
    })

    it('returns identity when zero-width bbox prevents horizontal scaling', () => {
      const zeroBbox = { x: 50, y: 0, width: 0, height: 50 }
      const zeroRect: RectShape = { ...rect, x: 50, width: 0 }
      const start = { x: 50, y: 50 }
      const current = { x: 70, y: 70 }
      const draft = computeResizeDraft(
        'se',
        start,
        current,
        zeroBbox,
        anchorFor('se', zeroBbox),
        [zeroRect],
        noMod,
      )

      const r = draft[zeroRect.id]
      expect(r.width).toBe(0)
      expect(r.height).toBe(70)
    })
  })
})
