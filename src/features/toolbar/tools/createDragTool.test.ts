import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { activeDragAtom, draftShapeAtom } from '@/store/atoms/draft'
import { undoStackAtom } from '@/store/atoms/history'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { styleDefaultsAtom } from '@/store/atoms/style-defaults'

import type { DragToolConfig } from './createDragTool'
import { createDragTool } from './createDragTool'
import { baseBoxConfig, type BoxGeometry, ev, makeCtx } from './dragToolHarness'
import type { Modifiers } from './registry'

const stubConfig: DragToolConfig<BoxGeometry> = {
  ...baseBoxConfig,
  toolId: 'stub-box',
}

describe('createDragTool', () => {
  const tool = createDragTool(stubConfig)

  it('exposes toolId and cursorClass from config', () => {
    expect(tool.id).toBe('stub-box')
    expect(tool.cursorClass).toBe('cursor-test')
  })

  // --- Primary-button gate ---

  it('ignores non-primary button on pointerdown', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }, { buttons: 2 }))
    expect(ctx.store.get(activeDragAtom)).toBeNull()
  })

  // --- Single-active-drag guard ---

  it('does not start a second drag while one is active', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    tool.onPointerDown(ctx, ev({ x: 20, y: 20 }, { x: 300, y: 300 }, { pointerId: 2 }))
    const drag = ctx.store.get(activeDragAtom)
    expect(drag?.startViewBox).toEqual({ x: 5, y: 5 })
  })

  // --- Down/move/up flow ---

  it('starts drag on primary pointerdown', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    expect(ctx.store.get(activeDragAtom)).toEqual({
      toolId: 'stub-box',
      pointerId: 1,
      startViewBox: { x: 5, y: 5 },
      startScreen: { x: 100, y: 100 },
    })
  })

  it('creates draft on move beyond threshold', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    const draft = ctx.store.get(draftShapeAtom)
    expect(draft).not.toBeNull()
    expect(draft?.type).toBe('rect')
  })

  it('commits shape on pointerup after drag', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    const shapes = ctx.store.get(documentAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({ type: 'rect', x: 2, y: 2, width: 8, height: 6 })
  })

  // --- Click-vs-drag threshold ---

  it('does not create draft below threshold', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 2.01, y: 2.01 }, { x: 101, y: 101 }))
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
  })

  it('treats screen distance exactly at threshold as drag', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    // Exactly 3px horizontally — not strictly less than DRAG_THRESHOLD_PX
    tool.onPointerMove(ctx, ev({ x: 5, y: 5 }, { x: 103, y: 100 }))
    expect(ctx.store.get(draftShapeAtom)).not.toBeNull()
  })

  // --- Click-fallback at down-point ---

  it('click-fallback inserts shape at down-point on sub-threshold release', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 5, y: 5 }, { x: 101, y: 100 }))

    const shapes = ctx.store.get(documentAtom).shapes
    expect(shapes).toHaveLength(1)
    // stub clickFallbackGeometry produces w:2, h:2
    expect(shapes[0]).toMatchObject({ type: 'rect', x: 5, y: 5, width: 2, height: 2 })
  })

  // --- Pointer-id guard on move ---

  it('ignores move events from a different pointer id', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 10 }, { x: 200, y: 200 }, { pointerId: 99 }))
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
  })

  // --- Pointer-id guard on up ---

  it('ignores pointerup from a different pointer id', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 10, y: 10 }, { x: 200, y: 200 }, { pointerId: 99 }))
    expect(ctx.store.get(activeDragAtom)).not.toBeNull()
    expect(ctx.store.get(documentAtom).shapes).toHaveLength(0)
  })

  // --- No-op write skip on identical geometry ---

  it('skips draft write when geometry is identical to previous', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))

    // First move — creates draft
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    const draft1 = ctx.store.get(draftShapeAtom)
    expect(draft1).not.toBeNull()

    // Second move to same screen point — geometry identical, should skip
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    const draft2 = ctx.store.get(draftShapeAtom)
    // Referential equality: same object because write was skipped
    expect(draft2).toBe(draft1)
  })

  it('updates draft when geometry changes', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))

    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    const draft1 = ctx.store.get(draftShapeAtom)

    tool.onPointerMove(ctx, ev({ x: 12, y: 10 }, { x: 220, y: 220 }))
    const draft2 = ctx.store.get(draftShapeAtom)

    expect(draft2).not.toBe(draft1)
    expect(draft2).toMatchObject({ width: 10, height: 8 })
  })

  // --- Deactivation cleanup ---

  it('clears draft and drag on deactivation', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    expect(ctx.store.get(draftShapeAtom)).not.toBeNull()
    expect(ctx.store.get(activeDragAtom)).not.toBeNull()

    tool.onDeactivate?.(ctx)

    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(ctx.store.get(activeDragAtom)).toBeNull()
  })

  it('deactivation is a no-op when no drag is active', () => {
    const ctx = makeCtx()
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(ctx.store.get(activeDragAtom)).toBeNull()

    tool.onDeactivate?.(ctx)

    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(ctx.store.get(activeDragAtom)).toBeNull()
  })

  // --- Single-undo-entry guarantee ---

  it('produces exactly one undo entry per gesture', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    expect(ctx.store.get(undoStackAtom)).toHaveLength(1)
  })

  it('produces one undo entry for click-fallback gesture', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 5, y: 5 }, { x: 101, y: 100 }))

    expect(ctx.store.get(undoStackAtom)).toHaveLength(1)
  })

  // --- Selection write after commit ---

  it('selects the new shape after commit', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 2, y: 2 }, { x: 101, y: 100 }))

    const selection = ctx.store.get(selectedIdsAtom)
    const shapes = ctx.store.get(documentAtom).shapes
    expect(selection).toEqual([shapes[0].id])
  })

  // --- Draft/drag cleanup after commit ---

  it('clears draft and drag after commit', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(ctx.store.get(activeDragAtom)).toBeNull()
  })

  // --- shouldHandlePointerMove predicate ---

  it('shouldHandlePointerMove returns true when drag is active', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(true)
  })

  it('shouldHandlePointerMove returns false when no drag is active', () => {
    const ctx = makeCtx()
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(false)
  })

  // --- Style defaults integration ---

  it('applies style defaults to committed shape', () => {
    const ctx = makeCtx()
    ctx.store.set(styleDefaultsAtom, { fill: '#ff0000', stroke: '#00ff00', strokeWidth: 3 })

    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 2, y: 2 }, { x: 101, y: 100 }))

    const shape = ctx.store.get(documentAtom).shapes[0]
    expect(shape.fill).toBe('#ff0000')
    expect(shape.stroke).toBe('#00ff00')
    expect(shape.strokeWidth).toBe(3)
  })

  it('applies style defaults to draft shape during drag', () => {
    const ctx = makeCtx()
    ctx.store.set(styleDefaultsAtom, { fill: '#abc', stroke: '#def', strokeWidth: 2 })

    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    const draft = ctx.store.get(draftShapeAtom)
    expect(draft?.fill).toBe('#abc')
    expect(draft?.stroke).toBe('#def')
    expect(draft?.strokeWidth).toBe(2)
  })

  // --- Move without active drag is a no-op ---

  it('move without active drag is a no-op', () => {
    const ctx = makeCtx()
    tool.onPointerMove(ctx, ev({ x: 10, y: 10 }, { x: 200, y: 200 }))
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
  })

  // --- Up without active drag is a no-op ---

  it('up without active drag is a no-op', () => {
    const ctx = makeCtx()
    tool.onPointerUp(ctx, ev({ x: 10, y: 10 }, { x: 200, y: 200 }))
    expect(ctx.store.get(documentAtom).shapes).toHaveLength(0)
  })

  // --- Empty-canvas click clears selection instead of click-fallback ---

  it('clears selection on sub-threshold release when selection is non-empty', () => {
    const ctx = makeCtx()
    ctx.store.set(selectedIdsAtom, ['existing-shape'])

    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 5, y: 5 }, { x: 101, y: 100 }))

    expect(ctx.store.get(selectedIdsAtom)).toEqual([])
    expect(ctx.store.get(documentAtom).shapes).toHaveLength(0)
    expect(ctx.store.get(activeDragAtom)).toBeNull()
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
  })

  it('fires click-fallback on sub-threshold release when selection is empty', () => {
    const ctx = makeCtx()
    expect(ctx.store.get(selectedIdsAtom)).toEqual([])

    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 5, y: 5 }, { x: 101, y: 100 }))

    expect(ctx.store.get(documentAtom).shapes).toHaveLength(1)
    expect(ctx.store.get(documentAtom).shapes[0]).toMatchObject({ type: 'rect', x: 5, y: 5 })
  })

  it('still triggers drag-to-draw when selection exists and drag exceeds threshold', () => {
    const ctx = makeCtx()
    ctx.store.set(selectedIdsAtom, ['existing-shape'])

    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    const shapes = ctx.store.get(documentAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({ type: 'rect', x: 2, y: 2, width: 8, height: 6 })
  })

  it('drag-back-to-start with selection clears selection instead of click-fallback', () => {
    const ctx = makeCtx()
    ctx.store.set(selectedIdsAtom, ['existing-shape'])

    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    expect(ctx.store.get(draftShapeAtom)).not.toBeNull()

    tool.onPointerUp(ctx, ev({ x: 2.1, y: 2.1 }, { x: 101, y: 100 }))

    expect(ctx.store.get(selectedIdsAtom)).toEqual([])
    expect(ctx.store.get(documentAtom).shapes).toHaveLength(0)
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(ctx.store.get(activeDragAtom)).toBeNull()
  })

  // --- Drag-back-to-start uses click-fallback ---

  it('uses click-fallback when drag returns near start before release', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    expect(ctx.store.get(draftShapeAtom)).not.toBeNull()

    // Release near start — screen distance below threshold
    tool.onPointerUp(ctx, ev({ x: 2.1, y: 2.1 }, { x: 101, y: 100 }))

    const shapes = ctx.store.get(documentAtom).shapes
    expect(shapes).toHaveLength(1)
    // Gets click-fallback geometry (w:2, h:2), not the dragged geometry
    expect(shapes[0]).toMatchObject({ width: 2, height: 2 })
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(ctx.store.get(activeDragAtom)).toBeNull()
  })

  // --- Modifiers pass-through ---

  it('forwards modifiers to geometryFromDrag during move', () => {
    let receivedModifiers: Modifiers | null = null
    const modifierTool = createDragTool({
      ...stubConfig,
      geometryFromDrag: (start, end, modifiers) => {
        receivedModifiers = modifiers
        return baseBoxConfig.geometryFromDrag(start, end, modifiers)
      },
    })
    const ctx = makeCtx()
    const shiftMod: Modifiers = { shift: true, alt: false, meta: false, ctrl: false }

    modifierTool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    modifierTool.onPointerMove(
      ctx,
      ev({ x: 10, y: 8 }, { x: 200, y: 200 }, { modifiers: shiftMod }),
    )

    expect(receivedModifiers).toEqual(shiftMod)
  })

  it('forwards modifiers to geometryFromDrag during commit', () => {
    let receivedModifiers: Modifiers | null = null
    const modifierTool = createDragTool({
      ...stubConfig,
      geometryFromDrag: (start, end, modifiers) => {
        receivedModifiers = modifiers
        return baseBoxConfig.geometryFromDrag(start, end, modifiers)
      },
    })
    const ctx = makeCtx()
    const altMod: Modifiers = { shift: false, alt: true, meta: false, ctrl: false }

    modifierTool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    modifierTool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }, { modifiers: altMod }))

    expect(receivedModifiers).toEqual(altMod)
  })

  // --- Sequential gestures produce independent shapes ---

  it('handles two consecutive gestures independently', () => {
    const ctx = makeCtx()

    tool.onPointerDown(ctx, ev({ x: 1, y: 1 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 5, y: 5 }, { x: 200, y: 200 }))
    tool.onPointerUp(ctx, ev({ x: 5, y: 5 }, { x: 200, y: 200 }))

    tool.onPointerDown(ctx, ev({ x: 10, y: 10 }, { x: 300, y: 300 }))
    tool.onPointerMove(ctx, ev({ x: 15, y: 15 }, { x: 400, y: 400 }))
    tool.onPointerUp(ctx, ev({ x: 15, y: 15 }, { x: 400, y: 400 }))

    const shapes = ctx.store.get(documentAtom).shapes
    expect(shapes).toHaveLength(2)
    expect(shapes[0]).toMatchObject({ x: 1, y: 1, width: 4, height: 4 })
    expect(shapes[1]).toMatchObject({ x: 10, y: 10, width: 5, height: 5 })
    expect(shapes[0].id).not.toBe(shapes[1].id)
  })

  it('second gesture does not inherit lastGeometry from first', () => {
    const ctx = makeCtx()

    // First gesture ends at specific geometry
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    // Second gesture uses same movement — should still produce a draft
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    const draft = ctx.store.get(draftShapeAtom)
    expect(draft).not.toBeNull()
    expect(draft).toMatchObject({ width: 8, height: 6 })
  })
})
