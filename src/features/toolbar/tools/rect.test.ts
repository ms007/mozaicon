import { createStore } from 'jotai'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Rect } from '@/lib/geometry/rect'
import type { Vec2 } from '@/lib/geometry/vec2'
import { draftShapeAtom } from '@/store/atoms/draft'
import { canUndoAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { styleDefaultsAtom } from '@/store/atoms/style-defaults'
import type { Icon } from '@/types/shapes'

import { createDragTool } from './createDragTool'
import { geometryFromDrag } from './rect'
import type { Modifiers, ToolCtx, ToolEvent } from './registry'

const NO_MODIFIERS: Modifiers = { shift: false, alt: false, meta: false, ctrl: false }
const SHIFT: Modifiers = { ...NO_MODIFIERS, shift: true }
const ALT: Modifiers = { ...NO_MODIFIERS, alt: true }
const SHIFT_ALT: Modifiers = { ...NO_MODIFIERS, shift: true, alt: true }

// --- geometryFromDrag (pure) ---

describe('geometryFromDrag', () => {
  it('computes basic rect from top-left to bottom-right', () => {
    expect(geometryFromDrag({ x: 2, y: 3 }, { x: 10, y: 7 }, NO_MODIFIERS)).toEqual({
      x: 2,
      y: 3,
      width: 8,
      height: 4,
    })
  })

  it('normalizes negative drag (bottom-right to top-left)', () => {
    expect(geometryFromDrag({ x: 10, y: 10 }, { x: 2, y: 3 }, NO_MODIFIERS)).toEqual({
      x: 2,
      y: 3,
      width: 8,
      height: 7,
    })
  })

  it('normalizes partial negative drag (right to left, top to bottom)', () => {
    expect(geometryFromDrag({ x: 10, y: 3 }, { x: 2, y: 7 }, NO_MODIFIERS)).toEqual({
      x: 2,
      y: 3,
      width: 8,
      height: 4,
    })
  })

  it('clamps width and height to 1', () => {
    const result = geometryFromDrag({ x: 5, y: 5 }, { x: 5, y: 5 }, NO_MODIFIERS)
    expect(result.width).toBe(1)
    expect(result.height).toBe(1)
  })

  it('shift constrains to square (longer axis wins)', () => {
    const result = geometryFromDrag({ x: 0, y: 0 }, { x: 10, y: 3 }, SHIFT)
    expect(result).toEqual({ x: 0, y: 0, width: 10, height: 10 })
  })

  it('shift preserves direction sign', () => {
    const result = geometryFromDrag({ x: 10, y: 10 }, { x: 5, y: 2 }, SHIFT)
    expect(result.width).toBe(8)
    expect(result.height).toBe(8)
    expect(result.x).toBe(2)
    expect(result.y).toBe(2)
  })

  it('shift handles zero dx', () => {
    const result = geometryFromDrag({ x: 5, y: 0 }, { x: 5, y: 8 }, SHIFT)
    expect(result).toEqual({ x: 5, y: 0, width: 8, height: 8 })
  })

  it('shift handles zero dy', () => {
    const result = geometryFromDrag({ x: 0, y: 5 }, { x: 8, y: 5 }, SHIFT)
    expect(result).toEqual({ x: 0, y: 5, width: 8, height: 8 })
  })

  it('alt anchors at center', () => {
    const result = geometryFromDrag({ x: 10, y: 10 }, { x: 14, y: 12 }, ALT)
    expect(result).toEqual({ x: 6, y: 8, width: 8, height: 4 })
  })

  it('alt handles negative drag', () => {
    const result = geometryFromDrag({ x: 10, y: 10 }, { x: 6, y: 7 }, ALT)
    expect(result).toEqual({ x: 6, y: 7, width: 8, height: 6 })
  })

  it('shift+alt produces square from center', () => {
    const result = geometryFromDrag({ x: 10, y: 10 }, { x: 14, y: 12 }, SHIFT_ALT)
    expect(result).toEqual({ x: 6, y: 6, width: 8, height: 8 })
  })

  it('shift+alt with negative drag direction', () => {
    const result = geometryFromDrag({ x: 10, y: 10 }, { x: 6, y: 8 }, SHIFT_ALT)
    expect(result).toEqual({ x: 6, y: 6, width: 8, height: 8 })
  })

  it('alt with zero-length drag clamps to 1×1 centered at start', () => {
    const result = geometryFromDrag({ x: 5, y: 5 }, { x: 5, y: 5 }, ALT)
    expect(result).toEqual({ x: 5, y: 5, width: 1, height: 1 })
  })

  it('handles fractional coordinates', () => {
    const result = geometryFromDrag({ x: 1.5, y: 2.5 }, { x: 4.5, y: 6.5 }, NO_MODIFIERS)
    expect(result).toEqual({ x: 1.5, y: 2.5, width: 3, height: 4 })
  })
})

// --- Rect tool lifecycle ---

const emptyDoc: Icon = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [],
}

function makeCtx(): ToolCtx {
  const store = createStore()
  store.set(activeIconAtom, emptyDoc)
  return { store, completeTool: vi.fn() }
}

function event(point: Vec2, screenPoint: Vec2, overrides: Partial<ToolEvent> = {}): ToolEvent {
  return {
    point,
    screenPoint,
    modifiers: NO_MODIFIERS,
    pointerId: 1,
    buttons: 1,
    ...overrides,
  }
}

const DEFAULT_SIZE = 4

function createRectTool() {
  return createDragTool<Rect>({
    toolId: 'rect',
    cursorClass: 'cursor-crosshair',
    geometryFromDrag,
    clickFallbackGeometry: (point) => ({
      x: point.x,
      y: point.y,
      width: DEFAULT_SIZE,
      height: DEFAULT_SIZE,
    }),
    geometryEquals: (a, b) =>
      a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height,
    buildShape: (geo, styles) => ({
      type: 'rect' as const,
      ...styles,
      ...geo,
    }),
  })
}

describe('rectTool lifecycle', () => {
  let rectTool: ReturnType<typeof createRectTool>

  beforeEach(() => {
    rectTool = createRectTool()
  })

  it('ignores non-primary button', () => {
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 5, y: 5 }, { x: 100, y: 100 }, { buttons: 2 }))
    expect(rectTool.shouldHandlePointerMove?.(ctx)).toBe(false)
  })

  it('starts a drag on primary pointerdown', () => {
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 5, y: 5 }, { x: 100, y: 100 }))
    expect(rectTool.shouldHandlePointerMove?.(ctx)).toBe(true)
  })

  it('does not start a second drag while one is active', () => {
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 5, y: 5 }, { x: 100, y: 100 }))
    rectTool.onPointerDown(ctx, event({ x: 10, y: 10 }, { x: 200, y: 200 }, { pointerId: 2 }))
    rectTool.onPointerMove(ctx, event({ x: 12, y: 12 }, { x: 200, y: 200 }))
    const draft = ctx.store.get(draftShapeAtom)
    expect(draft).toMatchObject({ x: 5, y: 5 })
  })

  it('creates draft on move beyond threshold', () => {
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 2, y: 2 }, { x: 100, y: 100 }))
    rectTool.onPointerMove(ctx, event({ x: 10, y: 8 }, { x: 200, y: 200 }))
    const draft = ctx.store.get(draftShapeAtom)
    expect(draft).not.toBeNull()
    expect(draft?.type).toBe('rect')
  })

  it('does not create draft below threshold', () => {
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 2, y: 2 }, { x: 100, y: 100 }))
    rectTool.onPointerMove(ctx, event({ x: 2.01, y: 2.01 }, { x: 101, y: 101 }))
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
  })

  it('ignores move events from a different pointer id', () => {
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 2, y: 2 }, { x: 100, y: 100 }))
    rectTool.onPointerMove(ctx, event({ x: 10, y: 10 }, { x: 200, y: 200 }, { pointerId: 99 }))
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
  })

  it('commits shape on pointerup after drag', () => {
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 2, y: 2 }, { x: 100, y: 100 }))
    rectTool.onPointerMove(ctx, event({ x: 10, y: 8 }, { x: 200, y: 200 }))
    rectTool.onPointerUp(ctx, event({ x: 10, y: 8 }, { x: 200, y: 200 }))

    const shapes = ctx.store.get(activeIconAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({ type: 'rect', x: 2, y: 2, width: 8, height: 6 })
  })

  it('click-fallback inserts default-sized rect', () => {
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 5, y: 5 }, { x: 100, y: 100 }))
    rectTool.onPointerUp(ctx, event({ x: 5, y: 5 }, { x: 101, y: 100 }))

    const shapes = ctx.store.get(activeIconAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({ type: 'rect', x: 5, y: 5, width: 4, height: 4 })
  })

  it('selects the new shape after commit', () => {
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 2, y: 2 }, { x: 100, y: 100 }))
    rectTool.onPointerUp(ctx, event({ x: 2, y: 2 }, { x: 101, y: 100 }))

    const selection = ctx.store.get(selectedIdsAtom)
    const shapes = ctx.store.get(activeIconAtom).shapes
    expect(selection).toEqual([shapes[0].id])
  })

  it('clears draft and drag after commit', () => {
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 2, y: 2 }, { x: 100, y: 100 }))
    rectTool.onPointerMove(ctx, event({ x: 10, y: 8 }, { x: 200, y: 200 }))
    rectTool.onPointerUp(ctx, event({ x: 10, y: 8 }, { x: 200, y: 200 }))

    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(rectTool.shouldHandlePointerMove?.(ctx)).toBe(false)
  })

  it('produces exactly one undo entry per gesture', () => {
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 2, y: 2 }, { x: 100, y: 100 }))
    rectTool.onPointerMove(ctx, event({ x: 10, y: 8 }, { x: 200, y: 200 }))
    rectTool.onPointerUp(ctx, event({ x: 10, y: 8 }, { x: 200, y: 200 }))

    expect(ctx.store.get(canUndoAtom)).toBe(true)
  })

  it('ignores pointerup from a different pointer id', () => {
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 2, y: 2 }, { x: 100, y: 100 }))
    rectTool.onPointerUp(ctx, event({ x: 10, y: 10 }, { x: 200, y: 200 }, { pointerId: 99 }))
    expect(rectTool.shouldHandlePointerMove?.(ctx)).toBe(true)
    expect(ctx.store.get(activeIconAtom).shapes).toHaveLength(0)
  })

  it('uses default styles when styleDefaults is not overridden', () => {
    const ctx = makeCtx()

    rectTool.onPointerDown(ctx, event({ x: 2, y: 2 }, { x: 100, y: 100 }))
    rectTool.onPointerUp(ctx, event({ x: 2, y: 2 }, { x: 101, y: 100 }))

    const shape = ctx.store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('#cccccc')
    expect(shape.stroke).toBe('none')
    expect(shape.strokeWidth).toBe(1)
  })

  it('applies styleDefaults to committed shape', () => {
    const ctx = makeCtx()
    ctx.store.set(styleDefaultsAtom, { fill: '#ff0000', stroke: '#00ff00', strokeWidth: 3 })

    rectTool.onPointerDown(ctx, event({ x: 2, y: 2 }, { x: 100, y: 100 }))
    rectTool.onPointerUp(ctx, event({ x: 2, y: 2 }, { x: 101, y: 100 }))

    const shape = ctx.store.get(activeIconAtom).shapes[0]
    expect(shape.fill).toBe('#ff0000')
    expect(shape.stroke).toBe('#00ff00')
    expect(shape.strokeWidth).toBe(3)
  })

  it('applies styleDefaults to draft shape during drag', () => {
    const ctx = makeCtx()
    ctx.store.set(styleDefaultsAtom, { fill: '#abc', stroke: '#def', strokeWidth: 2 })

    rectTool.onPointerDown(ctx, event({ x: 2, y: 2 }, { x: 100, y: 100 }))
    rectTool.onPointerMove(ctx, event({ x: 10, y: 8 }, { x: 200, y: 200 }))

    const draft = ctx.store.get(draftShapeAtom)
    expect(draft?.fill).toBe('#abc')
    expect(draft?.stroke).toBe('#def')
    expect(draft?.strokeWidth).toBe(2)
  })
})

describe('rectTool.onDeactivate', () => {
  let rectTool: ReturnType<typeof createRectTool>

  beforeEach(() => {
    rectTool = createRectTool()
  })

  it('clears draft and drag when a draft is active', () => {
    expect(rectTool.onDeactivate).toBeDefined()
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 2, y: 2 }, { x: 100, y: 100 }))
    rectTool.onPointerMove(ctx, event({ x: 10, y: 8 }, { x: 200, y: 200 }))
    expect(ctx.store.get(draftShapeAtom)).not.toBeNull()
    expect(rectTool.shouldHandlePointerMove?.(ctx)).toBe(true)

    rectTool.onDeactivate?.(ctx)

    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(rectTool.shouldHandlePointerMove?.(ctx)).toBe(false)
  })

  it('is a no-op when no draft is active', () => {
    const ctx = makeCtx()
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(rectTool.shouldHandlePointerMove?.(ctx)).toBe(false)

    rectTool.onDeactivate?.(ctx)

    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(rectTool.shouldHandlePointerMove?.(ctx)).toBe(false)
  })
})

describe('rectTool.shouldHandlePointerMove', () => {
  let rectTool: ReturnType<typeof createRectTool>

  beforeEach(() => {
    rectTool = createRectTool()
  })

  it('returns true when a drag is active', () => {
    expect(rectTool.shouldHandlePointerMove).toBeDefined()
    const ctx = makeCtx()
    rectTool.onPointerDown(ctx, event({ x: 5, y: 5 }, { x: 100, y: 100 }))
    expect(rectTool.shouldHandlePointerMove?.(ctx)).toBe(true)
  })

  it('returns false when no drag is active', () => {
    const ctx = makeCtx()
    expect(rectTool.shouldHandlePointerMove?.(ctx)).toBe(false)
  })
})
