import type { createStore } from 'jotai'

import type { Vec2 } from '@/lib/geometry/vec2'

export type Modifiers = {
  shift: boolean
  alt: boolean
  meta: boolean
  ctrl: boolean
}

export type ToolEvent = {
  point: Vec2
  screenPoint: Vec2
  modifiers: Modifiers
  pointerId: number
  buttons: number
}

export type JotaiStore = ReturnType<typeof createStore>

export type ToolCtx = {
  store: JotaiStore
}

export type DrawTool = {
  id: string
  cursorClass: string
  onPointerDown: (ctx: ToolCtx, event: ToolEvent) => void
  onPointerMove: (ctx: ToolCtx, event: ToolEvent) => void
  onPointerUp: (ctx: ToolCtx, event: ToolEvent) => void
  onDeactivate?: (ctx: ToolCtx) => void
  shouldHandlePointerMove?: (ctx: ToolCtx) => boolean
}

export type DrawToolMap = Partial<Record<string, DrawTool>>
