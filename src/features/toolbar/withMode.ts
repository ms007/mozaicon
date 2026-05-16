import type { DrawTool, ToolMode } from '@/features/toolbar/tools/registry'
import { activeDragAtom } from '@/store/atoms/draft'

/**
 * Decorates a tool to call `ctx.completeTool()` after a real gesture ends
 * when `mode` is `oneShot`; returns the tool unchanged for `sticky`.
 */
export function withMode(tool: DrawTool, mode: ToolMode): DrawTool {
  if (mode === 'sticky') return tool

  return {
    ...tool,
    onPointerUp(ctx, event) {
      const drag = ctx.store.get(activeDragAtom)
      const completing = drag !== null && drag.pointerId === event.pointerId
      tool.onPointerUp(ctx, event)
      if (completing) ctx.completeTool()
    },
  }
}
