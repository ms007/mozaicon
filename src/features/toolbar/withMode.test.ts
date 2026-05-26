import { createStore } from 'jotai'
import { beforeEach, describe, expect, it } from 'vitest'

import { createDragTool } from '@/features/toolbar/tools/createDragTool'
import {
  baseBoxConfig,
  type BoxGeometry,
  emptyDoc,
  ev,
  makeCtx,
} from '@/features/toolbar/tools/dragToolHarness'
import type { ToolCtx } from '@/features/toolbar/tools/registry'
import { documentAtom } from '@/store/atoms/document'
import { cancelDraftAtom } from '@/store/atoms/draft'
import { restoreSelectionAtom } from '@/store/atoms/selection'
import { activeToolAtom } from '@/store/atoms/tool'
import { undoCommand } from '@/store/commands/historyCommands'

import { withMode } from './withMode'

function createInnerTool() {
  return createDragTool<BoxGeometry>({ ...baseBoxConfig, toolId: 'wrapped-box' })
}

describe('withMode — sticky', () => {
  let innerTool: ReturnType<typeof createInnerTool>
  let tool: ReturnType<typeof withMode>

  beforeEach(() => {
    innerTool = createInnerTool()
    tool = withMode(innerTool, 'sticky')
  })

  it('returns the same tool reference (no wrapping)', () => {
    expect(tool).toBe(innerTool)
  })

  it('does not call completeTool after a gesture', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 2, y: 2 }, { x: 101, y: 100 }))

    expect(ctx.completeTool).not.toHaveBeenCalled()
  })
})

describe('withMode — oneShot', () => {
  let innerTool: ReturnType<typeof createInnerTool>
  let tool: ReturnType<typeof withMode>

  beforeEach(() => {
    innerTool = createInnerTool()
    tool = withMode(innerTool, 'oneShot')
  })

  it('calls completeTool after successful drag-to-draw', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    expect(ctx.completeTool).toHaveBeenCalledOnce()
  })

  it('calls completeTool after click-fallback insert', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 5, y: 5 }, { x: 101, y: 100 }))

    expect(ctx.completeTool).toHaveBeenCalledOnce()
  })

  it('calls completeTool on clear-selection pointerup (sub-threshold with existing selection)', () => {
    const ctx = makeCtx()
    ctx.store.set(restoreSelectionAtom, ['existing-shape'])

    tool.onPointerDown(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 5, y: 5 }, { x: 101, y: 100 }))

    expect(ctx.completeTool).toHaveBeenCalledOnce()
  })

  it('does not call completeTool when pointerup has mismatched pointerId during active drag', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }, { pointerId: 99 }))

    expect(innerTool.shouldHandlePointerMove?.(ctx)).toBe(true)
    expect(ctx.completeTool).not.toHaveBeenCalled()
  })

  it('does not call completeTool when pointerup arrives without any active drag', () => {
    const ctx = makeCtx()
    tool.onPointerUp(ctx, ev({ x: 5, y: 5 }, { x: 100, y: 100 }))

    expect(ctx.completeTool).not.toHaveBeenCalled()
  })

  it('does not call completeTool when the draft was cancelled before pointer release', () => {
    // Escape mid-drag clears the draft — by the time pointerup arrives,
    // there is no in-flight gesture, so the wrapper must not complete the tool.
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    ctx.store.set(cancelDraftAtom)
    tool.onPointerUp(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))

    expect(ctx.completeTool).not.toHaveBeenCalled()
  })

  it('calls completeTool on the next gesture after an external cancel', () => {
    const ctx = makeCtx()
    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerMove(ctx, ev({ x: 10, y: 8 }, { x: 200, y: 200 }))
    ctx.store.set(cancelDraftAtom)
    tool.onPointerMove(ctx, ev({ x: 12, y: 10 }, { x: 220, y: 220 }))

    tool.onPointerDown(ctx, ev({ x: 20, y: 20 }, { x: 300, y: 300 }))
    tool.onPointerUp(ctx, ev({ x: 20, y: 20 }, { x: 301, y: 300 }))

    expect(ctx.completeTool).toHaveBeenCalledOnce()
  })
})

describe('withMode — undo does not restore active tool', () => {
  it('undoing the shape leaves activeToolAtom at null', () => {
    const tool = withMode(createInnerTool(), 'oneShot')
    const ctx: ToolCtx = {
      store: createStore(),
      completeTool: () => {
        ctx.store.set(activeToolAtom, null)
      },
    }
    ctx.store.set(documentAtom, emptyDoc)
    ctx.store.set(activeToolAtom, 'wrapped-box')

    tool.onPointerDown(ctx, ev({ x: 2, y: 2 }, { x: 100, y: 100 }))
    tool.onPointerUp(ctx, ev({ x: 2, y: 2 }, { x: 101, y: 100 }))

    expect(ctx.store.get(activeToolAtom)).toBeNull()

    ctx.store.set(undoCommand)

    expect(ctx.store.get(documentAtom).shapes).toHaveLength(0)
    expect(ctx.store.get(activeToolAtom)).toBeNull()
  })
})
