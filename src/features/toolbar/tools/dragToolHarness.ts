import { createStore } from 'jotai'
import { vi } from 'vitest'

import type { Vec2 } from '@/lib/geometry/vec2'
import { documentAtom } from '@/store/atoms/document'
import type { Document } from '@/types/shapes'

import type { DragToolConfig } from './createDragTool'
import type { Modifiers, ToolCtx, ToolEvent } from './registry'

export type BoxGeometry = { x: number; y: number; w: number; h: number }

export const NO_MODIFIERS: Modifiers = { shift: false, alt: false, meta: false, ctrl: false }

export const emptyDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [],
}

export const baseBoxConfig: Omit<DragToolConfig<BoxGeometry>, 'toolId'> = {
  cursorClass: 'cursor-test',
  geometryFromDrag: (start: Vec2, end: Vec2): BoxGeometry => ({
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x) || 1,
    h: Math.abs(end.y - start.y) || 1,
  }),
  clickFallbackGeometry: (point: Vec2): BoxGeometry => ({
    x: point.x,
    y: point.y,
    w: 2,
    h: 2,
  }),
  geometryEquals: (a: BoxGeometry, b: BoxGeometry): boolean =>
    a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h,
  buildShape: (
    geo: BoxGeometry,
    styles: { fill: string; stroke: string; strokeWidth: number },
  ) => ({
    type: 'rect' as const,
    ...styles,
    x: geo.x,
    y: geo.y,
    width: geo.w,
    height: geo.h,
  }),
}

export function makeCtx(): ToolCtx & { completeTool: ReturnType<typeof vi.fn> } {
  const store = createStore()
  store.set(documentAtom, emptyDoc)
  const completeTool = vi.fn()
  return { store, completeTool }
}

export function ev(point: Vec2, screenPoint: Vec2, overrides: Partial<ToolEvent> = {}): ToolEvent {
  return {
    point,
    screenPoint,
    modifiers: NO_MODIFIERS,
    pointerId: 1,
    buttons: 1,
    ...overrides,
  }
}
