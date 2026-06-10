import type { DrawTool, ToolMode } from '@/features/toolbar/tools/registry'
import { activeIconAtom } from '@/store/atoms/project'

export function withMode(tool: DrawTool, mode: ToolMode): DrawTool {
  if (mode === 'sticky') return tool

  return {
    ...tool,
    onPointerUp(ctx, event) {
      // Icon ref changes only on a real commit (addShape, …); sub-threshold
      // click-fallbacks and externally cancelled gestures leave it unchanged.
      const iconBefore = ctx.store.get(activeIconAtom)
      tool.onPointerUp(ctx, event)
      if (ctx.store.get(activeIconAtom) !== iconBefore) ctx.completeTool()
    },
  }
}
