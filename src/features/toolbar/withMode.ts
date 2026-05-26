import type { DrawTool, ToolMode } from '@/features/toolbar/tools/registry'
import { documentAtom } from '@/store/atoms/document'

export function withMode(tool: DrawTool, mode: ToolMode): DrawTool {
  if (mode === 'sticky') return tool

  return {
    ...tool,
    onPointerUp(ctx, event) {
      // Document ref changes only on a real commit (addShape, …); sub-threshold
      // click-fallbacks and externally cancelled gestures leave it unchanged.
      const docBefore = ctx.store.get(documentAtom)
      tool.onPointerUp(ctx, event)
      if (ctx.store.get(documentAtom) !== docBefore) ctx.completeTool()
    },
  }
}
