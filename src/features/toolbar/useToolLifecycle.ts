import { useAtomValue, useStore } from 'jotai'
import { useEffect } from 'react'

import type { DrawTool } from '@/features/toolbar/tools/registry'
import { activeToolAtom } from '@/store/atoms/tool'

import { DRAW_TOOL_MAP } from './registry'

const noop = () => {
  // onDeactivate ctx never invokes completeTool; this satisfies the shared ToolCtx shape.
}

export function useToolLifecycle(): DrawTool | undefined {
  const activeTool = useAtomValue(activeToolAtom)
  const store = useStore()
  const tool = activeTool ? DRAW_TOOL_MAP[activeTool] : undefined

  useEffect(() => {
    return () => {
      tool?.onDeactivate?.({ store, completeTool: noop })
    }
  }, [tool, store])

  return tool
}
