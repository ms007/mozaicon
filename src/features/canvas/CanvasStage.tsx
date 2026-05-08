import { useAtomValue, useSetAtom, useStore } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { useCallback, useEffect, useRef } from 'react'

import { DraftLayer } from '@/features/canvas/DraftLayer'
import { ShapeRenderer } from '@/features/canvas/renderers/ShapeRenderer'
import { drawTools } from '@/features/toolbar/tools'
import type { ToolEvent } from '@/features/toolbar/tools/registry'
import { screenToViewBox } from '@/lib/svg/screenToViewBox'
import { cn } from '@/lib/utils'
import { documentAtom, shapeAtomsAtom } from '@/store/atoms/document'
import { activeDragAtom, cancelDraftAtom } from '@/store/atoms/draft'
import { activeToolAtom } from '@/store/atoms/tool'

const CANVAS_SIZE = 512

// Pre-join so the stage only re-renders on actual viewBox changes; strings
// compare by value, sidestepping the fresh-array-per-immer-update trap.
const viewBoxStringAtom = selectAtom(documentAtom, (doc) => doc.viewBox.join(' '))

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

export function CanvasStage() {
  const viewBox = useAtomValue(viewBoxStringAtom)
  const shapeAtoms = useAtomValue(shapeAtomsAtom)
  const activeTool = useAtomValue(activeToolAtom)
  const cancelDraft = useSetAtom(cancelDraftAtom)
  const store = useStore()
  const svgRef = useRef<SVGSVGElement>(null)

  const tool = drawTools[activeTool]

  useEffect(() => {
    if (store.get(activeDragAtom)) {
      cancelDraft()
    }
  }, [activeTool, cancelDraft, store])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!tool) return
      if (e.button !== 0) return
      const svg = svgRef.current
      if (!svg) return

      svg.setPointerCapture(e.pointerId)
      tool.onPointerDown({ store }, makeToolEvent(svg, e))
    },
    [tool, store],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!tool) return
      // Skip the work (CTM inverse + allocations) when no drag is active.
      if (!store.get(activeDragAtom)) return
      const svg = svgRef.current
      if (!svg) return
      tool.onPointerMove({ store }, makeToolEvent(svg, e))
    },
    [tool, store],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!tool) return
      const svg = svgRef.current
      if (!svg) return

      try {
        tool.onPointerUp({ store }, makeToolEvent(svg, e))
      } finally {
        if (svg.hasPointerCapture(e.pointerId)) {
          svg.releasePointerCapture(e.pointerId)
        }
      }
    },
    [tool, store],
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
      if (store.get(activeDragAtom)) {
        e.preventDefault()
      }
    },
    [store],
  )

  return (
    <svg
      ref={svgRef}
      aria-label="Icon canvas"
      role="img"
      viewBox={viewBox}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className={cn('border-border bg-background block border', tool?.cursorClass)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={handleContextMenu}
    >
      {shapeAtoms.map((shapeAtom) => (
        <ShapeRenderer key={String(shapeAtom)} shapeAtom={shapeAtom} />
      ))}
      <DraftLayer />
    </svg>
  )
}
