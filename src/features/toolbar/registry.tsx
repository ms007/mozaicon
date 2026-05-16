import type { ReactNode } from 'react'

import type { ToolOption } from '@/components/ToolPalette'
import type { DrawTool, DrawToolMap, ToolMode } from '@/features/toolbar/tools/registry'
import { Rect } from '@/icons'

import { rectTool } from './tools/rect'
import { withMode } from './withMode'

export type ToolDescriptor = {
  id: string
  label: string
  icon: ReactNode
  mode: ToolMode
  hotkey: string
  drawTool: DrawTool
}

type ToolDescriptorInput = Omit<ToolDescriptor, 'drawTool'> & { drawTool: DrawTool }

function descriptor(input: ToolDescriptorInput): ToolDescriptor {
  return { ...input, drawTool: withMode(input.drawTool, input.mode) }
}

export const TOOL_REGISTRY: readonly ToolDescriptor[] = [
  descriptor({
    id: 'rect',
    label: 'Rectangle',
    icon: <Rect />,
    mode: 'oneShot',
    hotkey: 'R',
    drawTool: rectTool,
  }),
]

export const DRAW_TOOL_MAP: DrawToolMap = Object.fromEntries(
  TOOL_REGISTRY.map((t) => [t.id, t.drawTool]),
)

export const TOOL_OPTIONS: ToolOption[] = TOOL_REGISTRY.map((t) => ({
  value: t.id,
  icon: t.icon,
  label: t.label,
  shortcut: t.hotkey,
}))

export function getToolDescriptors(): readonly ToolDescriptor[] {
  return TOOL_REGISTRY
}

export function getToolById(id: string): ToolDescriptor | undefined {
  return TOOL_REGISTRY.find((t) => t.id === id)
}
