import { useAtomValue, useStore } from 'jotai'
import { useMemo } from 'react'

import { ToolPalette } from '@/components/ToolPalette'
import { activeToolAtom } from '@/store/atoms/tool'

import { createToolbarActions } from './actions'
import { TOOL_OPTIONS } from './registry'

export function Toolbar() {
  const store = useStore()
  const activeTool = useAtomValue(activeToolAtom)
  const actions = useMemo(() => createToolbarActions(store), [store])

  return (
    <div className="absolute top-1/2 left-3 z-10 -translate-y-1/2">
      <ToolPalette
        options={TOOL_OPTIONS}
        value={activeTool}
        onChange={actions.handleChange}
        aria-label="Drawing tools"
      />
    </div>
  )
}
