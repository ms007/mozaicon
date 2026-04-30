import { useAtom, useSetAtom } from 'jotai'

import { type ToolOption, ToolPalette } from '@/components/ToolPalette'
import { Rect } from '@/icons'
import { activeToolAtom } from '@/store/atoms/tool'
import { addShapeCommand } from '@/store/commands/addShape'

import { DEFAULT_RECT } from './actions'

const tools: ToolOption[] = [{ value: 'rect', icon: <Rect />, label: 'Rectangle', shortcut: 'R' }]

export function Toolbar() {
  const [activeTool, setActiveTool] = useAtom(activeToolAtom)
  const addShape = useSetAtom(addShapeCommand)

  function handleChange(value: string) {
    setActiveTool(value)
  }

  function handleItemClick(value: string) {
    if (value === 'rect') {
      addShape(DEFAULT_RECT)
    }
  }

  return (
    <div className="absolute top-1/2 left-3 z-10 -translate-y-1/2">
      <ToolPalette
        options={tools}
        value={activeTool}
        onChange={handleChange}
        onItemClick={handleItemClick}
        aria-label="Drawing tools"
      />
    </div>
  )
}
