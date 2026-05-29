import { useSetAtom, useStore } from 'jotai'
import { useCallback, useMemo } from 'react'

import type { DrawTool, ToolCtx, ToolEvent } from '@/features/toolbar/tools/registry'
import { DRAG_THRESHOLD_PX, screenDistance } from '@/lib/geometry/distance'
import { screenToViewBox } from '@/lib/svg/screenToViewBox'
import { cancelDraftAtom } from '@/store/atoms/draft'
import {
  type MarqueeDraft,
  marqueeDraftAtom,
  previewSelectedIdsAtom,
} from '@/store/atoms/marquee-draft'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { activeToolAtom } from '@/store/atoms/tool'
import { clearSelectionCommand, selectShapesCommand } from '@/store/commands/selectionCommands'

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

export type PointerHandlers<E extends Element = Element> = {
  onPointerDown: (e: React.PointerEvent<E>) => void
  onPointerMove: (e: React.PointerEvent<E>) => void
  onPointerUp: (e: React.PointerEvent<E>) => void
  onPointerCancel: (e: React.PointerEvent<E>) => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function useToolPointerBridge(
  tool: DrawTool | undefined,
  svgRef: React.RefObject<SVGSVGElement | null>,
): PointerHandlers {
  const store = useStore()
  const cancelDraft = useSetAtom(cancelDraftAtom)
  const ctx = useMemo<ToolCtx>(
    () => ({
      store,
      completeTool: () => {
        store.set(activeToolAtom, null)
      },
    }),
    [store],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      const svg = svgRef.current
      if (!svg) return

      // Shape and resize-handle pointerdown handlers stopPropagation, so
      // reaching the SVG here means a true background click.
      if (!tool) {
        const vb = screenToViewBox(svg, e.clientX, e.clientY)
        const draft: MarqueeDraft = {
          pointerId: e.pointerId,
          startScreen: { x: e.clientX, y: e.clientY },
          startViewBox: vb,
          current: vb,
          additive: e.shiftKey,
          baseSelection: e.shiftKey ? store.get(selectedIdsAtom) : [],
        }
        store.set(marqueeDraftAtom, draft)
        e.currentTarget.setPointerCapture(e.pointerId)
        return
      }

      e.currentTarget.setPointerCapture(e.pointerId)
      tool.onPointerDown(ctx, makeToolEvent(svg, e))
    },
    [tool, ctx, store, svgRef],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!tool) {
        const draft = store.get(marqueeDraftAtom)
        if (!draft) return
        const svg = svgRef.current
        if (!svg) return
        const vb = screenToViewBox(svg, e.clientX, e.clientY)
        if (vb.x === draft.current.x && vb.y === draft.current.y) return
        store.set(marqueeDraftAtom, { ...draft, current: vb })
        return
      }
      // Skip the work (CTM inverse + allocations) when the tool says it's idle.
      if (tool.shouldHandlePointerMove && !tool.shouldHandlePointerMove(ctx)) return
      const svg = svgRef.current
      if (!svg) return
      tool.onPointerMove(ctx, makeToolEvent(svg, e))
    },
    [tool, ctx, store, svgRef],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const svg = svgRef.current
      const target = e.currentTarget
      // Release capture unconditionally — if a prior Escape cleared the tool
      // mid-drag, the handler element would otherwise keep capture until the
      // pointer leaves the document.
      try {
        if (!svg) return
        if (!tool) {
          const draft = store.get(marqueeDraftAtom)
          if (!draft) return
          const dist = screenDistance(draft.startScreen, { x: e.clientX, y: e.clientY })
          if (dist < DRAG_THRESHOLD_PX) {
            store.set(marqueeDraftAtom, null)
            if (!draft.additive) {
              store.set(clearSelectionCommand, undefined)
            }
          } else {
            const ids = store.get(previewSelectedIdsAtom)
            store.set(marqueeDraftAtom, null)
            store.set(selectShapesCommand, ids)
          }
          return
        }
        tool.onPointerUp(ctx, makeToolEvent(svg, e))
      } finally {
        if (target.hasPointerCapture(e.pointerId)) {
          target.releasePointerCapture(e.pointerId)
        }
      }
    },
    [tool, ctx, store, svgRef],
  )

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      cancelDraft()
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
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
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onContextMenu: handleContextMenu,
  }
}
