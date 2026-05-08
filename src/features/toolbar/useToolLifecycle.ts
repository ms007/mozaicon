import { useAtomValue, useStore } from 'jotai'
import { useEffect } from 'react'

import { drawTools } from '@/features/toolbar/tools'
import type { DrawTool } from '@/features/toolbar/tools/registry'
import { activeToolAtom } from '@/store/atoms/tool'

export function useToolLifecycle(): DrawTool | undefined {
  const activeTool = useAtomValue(activeToolAtom)
  const store = useStore()
  const tool = drawTools[activeTool]

  // Cleanup runs with the previous closure when `tool` changes, and again on
  // unmount — covering both "switch away mid-draft" and "tear down the canvas
  // mid-draft" without a manual ref dance.
  useEffect(() => {
    return () => {
      tool?.onDeactivate?.({ store })
    }
  }, [tool, store])

  return tool
}
