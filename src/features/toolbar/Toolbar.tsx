import { useAtomValue, useStore } from 'jotai'
import { useMemo } from 'react'

import { type ToolOption, ToolPalette } from '@/components/ToolPalette'
import { getHint } from '@/features/shortcuts/registry'
import { Rect } from '@/icons'
import { activeToolAtom } from '@/store/atoms/tool'

import { createToolbarActions } from './actions'
import { TOOLBAR_SHORTCUT_META } from './bindings'

const tools: ToolOption[] = [
  {
    value: 'rect',
    icon: <Rect />,
    label: 'Rectangle',
    shortcut: getHint(TOOLBAR_SHORTCUT_META, 'tool.rect.add'),
  },
]

export function Toolbar() {
  const store = useStore()
  const activeTool = useAtomValue(activeToolAtom)
  const actions = useMemo(() => createToolbarActions(store), [store])

  return (
    <div className="absolute top-1/2 left-3 z-10 -translate-y-1/2">
      <ToolPalette
        options={tools}
        value={activeTool}
        onChange={actions.handleChange}
        onItemClick={actions.handleItemClick}
        aria-label="Drawing tools"
      />
    </div>
  )
}
