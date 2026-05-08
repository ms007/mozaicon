import { useSetAtom, useStore } from 'jotai'
import { useCallback, useMemo, useRef } from 'react'

import type { DrawTool, ToolCtx, ToolEvent } from '@/features/toolbar/tools/registry'
import { screenToViewBox } from '@/lib/svg/screenToViewBox'
import { cancelDraftAtom } from '@/store/atoms/draft'

function makeToolEvent(svg: SVGSVGElement, e: React.PointerEvent): ToolEvent {
  const point = screenToViewBox(svg, e.clientX, e.clientY)
  return {
    point,
    screenPoint: { x: e.clientX, y: e.clientY },
    modifiers: {
      shift: e.shiftKey,
      alt: e.altKey,
      meta: e.metaKey,
      ctrl: e.ctrlKey,
    },
    pointerId: e.pointerId,
    buttons: e.buttons,
  }
}

export type PointerHandlers = {
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void
  onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => void
  onPointerCancel: (e: React.PointerEvent<SVGSVGElement>) => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function useToolPointerBridge(tool: DrawTool | undefined): {
  svgRef: React.RefObject<SVGSVGElement | null>
  handlers: PointerHandlers
} {
  const store = useStore()
  const cancelDraft = useSetAtom(cancelDraftAtom)
  const svgRef = useRef<SVGSVGElement>(null)
  const ctx = useMemo<ToolCtx>(() => ({ store }), [store])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!tool) return
      if (e.button !== 0) return
      const svg = svgRef.current
      if (!svg) return

      svg.setPointerCapture(e.pointerId)
      tool.onPointerDown(ctx, makeToolEvent(svg, e))
    },
    [tool, ctx],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!tool) return
      // Skip the work (CTM inverse + allocations) when the tool says it's idle.
      if (tool.shouldHandlePointerMove && !tool.shouldHandlePointerMove(ctx)) return
      const svg = svgRef.current
      if (!svg) return
      tool.onPointerMove(ctx, makeToolEvent(svg, e))
    },
    [tool, ctx],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!tool) return
      const svg = svgRef.current
      if (!svg) return

      try {
        tool.onPointerUp(ctx, makeToolEvent(svg, e))
      } finally {
        if (svg.hasPointerCapture(e.pointerId)) {
          svg.releasePointerCapture(e.pointerId)
        }
      }
    },
    [tool, ctx],
  )

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      cancelDraft()
      const svg = svgRef.current
      if (svg?.hasPointerCapture(e.pointerId)) {
        svg.releasePointerCapture(e.pointerId)
      }
    },
    [cancelDraft],
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (tool?.shouldHandlePointerMove?.(ctx)) {
        e.preventDefault()
      }
    },
    [tool, ctx],
  )

  return {
    svgRef,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onContextMenu: handleContextMenu,
    },
  }
}
