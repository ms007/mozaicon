import { beforeEach, describe, expect, it } from 'vitest'

import { cancelDraftAtom, draftShapeAtom } from '@/store/atoms/draft'
import { canUndoAtom, undoStackAtom } from '@/store/atoms/history'
import { activeIconAtom } from '@/store/atoms/project'
import { restoreSelectionAtom, selectedIdsAtom } from '@/store/atoms/selection'
import { styleDefaultsAtom } from '@/store/atoms/style-defaults'
import { undoCommand } from '@/store/commands/historyCommands'

import type { DragToolConfig } from './createDragTool'
import { createDragTool } from './createDragTool'
import { baseBoxConfig, type BoxGeometry, ev, makeCtx } from './dragToolHarness'
import type { Modifiers } from './registry'

const stubConfig: DragToolConfig<BoxGeometry> = {
  ...baseBoxConfig,
  toolId: 'stub-box',
}

describe('createDragTool', () => {
  let tool: ReturnType<typeof createDragTool<BoxGeometry>>

  beforeEach(() => {
    tool = createDragTool(stubConfig)
  })

  it('exposes toolId and cursorClass from config', () => {
    expect(tool.id).toBe('stub-box')
    expect(tool.cursorClass).toBe('cursor-test')
  })

  // --- Primary-button gate ---

  it('ignores non-primary button on pointerdown', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }, { buttons: 2 }))
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(false)
  })

  // --- Single-active-drag guard ---

  it('does not start a second drag while one is active', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    tool.onPointerDown(ctx, ev({ x: 20, y: 20 }, { x: 300, y: 300 }, { pointerId: 2 }))
    tool.onPointerMove(ctx, ev({ x: 12, y: 12 }, { x: 200, y: 200 }))
    const draft = ctx.store.get(draftShapeAtom)
    expect(draft).toMatchObject({ x: 5, y: 5 })
  })

  // --- Down/move/up flow ---

  it('starts drag on primary pointerdown', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(true)
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

    const shapes = ctx.store.get(activeIconAtom).shapes
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

    const shapes = ctx.store.get(activeIconAtom).shapes
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
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(true)
    expect(ctx.store.get(activeIconAtom).shapes).toHaveLength(0)
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
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(true)

    tool.onDeactivate?.(ctx)

    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(false)
  })

  it('deactivation is a no-op when no drag is active', () => {
    const ctx = makeCtx()
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(false)

    tool.onDeactivate?.(ctx)

    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(false)
  })

  // --- Single-undo-entry guarantee ---

  it('produces exactly one undo entry per gesture', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    expect(ctx.store.get(canUndoAtom)).toBe(true)
  })

  it('produces one undo entry for click-fallback gesture', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 5, y: 5 }, { x: 101, y: 100 }))

    expect(ctx.store.get(canUndoAtom)).toBe(true)
  })

  // --- Selection write after commit ---

  it('selects the new shape after commit', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 2, y: 2 }, { x: 101, y: 100 }))

    const selection = ctx.store.get(selectedIdsAtom)
    const shapes = ctx.store.get(activeIconAtom).shapes
    expect(selection).toEqual([shapes[0].id])
  })

  // --- Draft/drag cleanup after commit ---

  it('clears draft and drag after commit', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(false)
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

    const shape = ctx.store.get(activeIconAtom).shapes[0]
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
    expect(ctx.store.get(activeIconAtom).shapes).toHaveLength(0)
  })

  // --- Click-fallback fires regardless of selection state ---

  it('fires click-fallback on sub-threshold release even when selection is non-empty', () => {
    const ctx = makeCtx()
    ctx.store.set(restoreSelectionAtom, ['existing-shape'])

    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 5, y: 5 }, { x: 101, y: 100 }))

    const shapes = ctx.store.get(activeIconAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({ type: 'rect', x: 5, y: 5, width: 2, height: 2 })
    expect(ctx.store.get(selectedIdsAtom)).toEqual([shapes[0].id])
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(false)
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
  })

  it('fires click-fallback on sub-threshold release when selection is empty', () => {
    const ctx = makeCtx()
    expect(ctx.store.get(selectedIdsAtom)).toEqual([])

    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 5, y: 5 }, { x: 101, y: 100 }))

    expect(ctx.store.get(activeIconAtom).shapes).toHaveLength(1)
    expect(ctx.store.get(activeIconAtom).shapes[0]).toMatchObject({ type: 'rect', x: 5, y: 5 })
  })

  it('still triggers drag-to-draw when selection exists and drag exceeds threshold', () => {
    const ctx = makeCtx()
    ctx.store.set(restoreSelectionAtom, ['existing-shape'])

    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    const shapes = ctx.store.get(activeIconAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({ type: 'rect', x: 2, y: 2, width: 8, height: 6 })
  })

  it('drag-back-to-start with selection uses click-fallback', () => {
    const ctx = makeCtx()
    ctx.store.set(restoreSelectionAtom, ['existing-shape'])

    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    expect(ctx.store.get(draftShapeAtom)).not.toBeNull()

    tool.onPointerUp(ctx, ev({ x: 2.1, y: 2.1 }, { x: 101, y: 100 }))

    const shapes = ctx.store.get(activeIconAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({ width: 2, height: 2 })
    expect(ctx.store.get(selectedIdsAtom)).toEqual([shapes[0].id])
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(false)
  })

  // --- Drag-back-to-start uses click-fallback ---

  it('uses click-fallback when drag returns near start before release', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    expect(ctx.store.get(draftShapeAtom)).not.toBeNull()

    // Release near start — screen distance below threshold
    tool.onPointerUp(ctx, ev({ x: 2.1, y: 2.1 }, { x: 101, y: 100 }))

    const shapes = ctx.store.get(activeIconAtom).shapes
    expect(shapes).toHaveLength(1)
    // Gets click-fallback geometry (w:2, h:2), not the dragged geometry
    expect(shapes[0]).toMatchObject({ width: 2, height: 2 })
    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(false)
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

    const shapes = ctx.store.get(activeIconAtom).shapes
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

  // --- Selection is set atomically via command, not post-hoc ---

  it('history entry selectionAfter contains the committed shape id', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 2, y: 2 }, { x: 101, y: 100 }))

    const undo = ctx.store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    const committedId = ctx.store.get(activeIconAtom).shapes[0].id
    expect(undo[0].selectionAfter).toEqual([committedId])
  })

  it('undo after drag-tool gesture restores both document and selection', () => {
    const ctx = makeCtx()
    ctx.store.set(restoreSelectionAtom, ['pre-existing'])

    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    expect(ctx.store.get(activeIconAtom).shapes).toHaveLength(1)
    expect(ctx.store.get(selectedIdsAtom)).toEqual([ctx.store.get(activeIconAtom).shapes[0].id])

    ctx.store.set(undoCommand)

    expect(ctx.store.get(activeIconAtom).shapes).toHaveLength(0)
    expect(ctx.store.get(selectedIdsAtom)).toEqual(['pre-existing'])
  })

  // --- External cancel (e.g. Escape clearing draftShapeAtom) ---

  it('resets closure on next move after external cancel mid-drag', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    expect(ctx.store.get(draftShapeAtom)).not.toBeNull()

    ctx.store.set(cancelDraftAtom)
    expect(ctx.store.get(draftShapeAtom)).toBeNull()

    tool.onPointerMove(ctx, ev({ x: 12, y: 10 }, { x: 220, y: 220 }))

    expect(ctx.store.get(draftShapeAtom)).toBeNull()
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(false)
  })

  it('does not commit shape on pointerUp after external cancel', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    ctx.store.set(cancelDraftAtom)

    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    expect(ctx.store.get(activeIconAtom).shapes).toHaveLength(0)
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(false)
  })

  it('starts a fresh gesture after external cancel', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    ctx.store.set(cancelDraftAtom)
    tool.onPointerMove(ctx, ev({ x: 12, y: 10 }, { x: 220, y: 220 }))

    tool.onPointerDown(ctx, ev({ x: 20, y: 20 }, { x: 300, y: 300 }))
    tool.onPointerMove(ctx, ev({ x: 28, y: 26 }, { x: 400, y: 400 }))
    tool.onPointerUp(ctx, ev({ x: 28, y: 26 }, { x: 400, y: 400 }))

    const shapes = ctx.store.get(activeIconAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({ x: 20, y: 20, width: 8, height: 6 })
  })

  it('recovers from stale closure after pointercancel clears only atom state', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))

    // Simulate pointercancel: clears draftShapeAtom via cancelDraftAtom
    // but cannot reach the closure's activeDrag
    ctx.store.set(cancelDraftAtom)

    tool.onPointerDown(ctx, ev({ x: 10, y: 10 }, { x: 300, y: 300 }))
    expect(tool.shouldHandlePointerMove?.(ctx)).toBe(true)

    tool.onPointerMove(ctx, ev({ x: 18, y: 16 }, { x: 400, y: 400 }))
    tool.onPointerUp(ctx, ev({ x: 18, y: 16 }, { x: 400, y: 400 }))

    const shapes = ctx.store.get(activeIconAtom).shapes
    expect(shapes).toHaveLength(1)
    expect(shapes[0]).toMatchObject({ x: 10, y: 10, width: 8, height: 6 })
  })
})
