import { useStore } from 'jotai'
import { useCallback, useEffect, useRef } from 'react'

import type { Rect } from '@/lib/geometry/rect'
import { scaleShape } from '@/lib/geometry/scale'
import type { Vec2 } from '@/lib/geometry/vec2'
import { bboxOf } from '@/lib/svg/bbox'
import { screenToViewBox } from '@/lib/svg/screenToViewBox'
import { resizeDraftAtom } from '@/store/atoms/resize-draft'
import { selectedShapesAtom } from '@/store/atoms/selection'
import { resizeShapeCommand } from '@/store/commands/resizeShape'
import type { Shape } from '@/types/shapes'

import {
  anchorForHandle,
  bboxCenter,
  type HandlePosition,
  isCornerHandle,
  scaleFactors,
} from './resizeGeometry'

export type { HandlePosition }

type Modifiers = { shift: boolean; alt: boolean }

type DragState = {
  pointerId: number
  handle: HandlePosition
  anchor: Vec2
  startPoint: Vec2
  startBbox: Rect
  shapes: Shape[]
}

export function computeResizeDraft(
  handle: HandlePosition,
  startPoint: Vec2,
  currentPoint: Vec2,
  startBbox: Rect,
  cornerAnchor: Vec2,
  shapes: Shape[],
  modifiers: Modifiers,
): Record<string, Rect> {
  const useCenter = modifiers.alt
  const anchor = useCenter ? bboxCenter(startBbox) : cornerAnchor

  let { sx, sy } = scaleFactors(handle, startPoint, currentPoint, startBbox, useCenter)

  if (modifiers.shift && isCornerHandle(handle)) {
    const absMax = Math.max(Math.abs(sx), Math.abs(sy))
    sx = (sx >= 0 ? 1 : -1) * absMax
    sy = (sy >= 0 ? 1 : -1) * absMax
  }

  const draft: Record<string, Rect> = {}
  for (const shape of shapes) {
    const scaled = scaleShape(shape, anchor, sx, sy)
    draft[shape.id] = bboxOf(scaled)
  }
  return draft
}

function computeDraftFromEvent(
  drag: DragState,
  clientX: number,
  clientY: number,
  svg: SVGSVGElement,
  modifiers: Modifiers,
) {
  const point = screenToViewBox(svg, clientX, clientY)
  return computeResizeDraft(
    drag.handle,
    drag.startPoint,
    point,
    drag.startBbox,
    drag.anchor,
    drag.shapes,
    modifiers,
  )
}

export function useResizeGesture(svgRef: React.RefObject<SVGSVGElement | null>) {
  const store = useStore()
  const dragRef = useRef<DragState | null>(null)

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (e.pointerId !== drag?.pointerId) return

      const svg = svgRef.current
      if (!svg) return

      const modifiers = { shift: e.shiftKey, alt: e.altKey }
      const draft = computeDraftFromEvent(drag, e.clientX, e.clientY, svg, modifiers)
      store.set(resizeDraftAtom, draft)
    }

    const handleUp = (e: PointerEvent) => {
      const drag = dragRef.current
      if (e.pointerId !== drag?.pointerId) return

      const svg = svgRef.current
      if (!svg) return

      const modifiers = { shift: e.shiftKey, alt: e.altKey }
      const geometryById = computeDraftFromEvent(drag, e.clientX, e.clientY, svg, modifiers)
      store.set(resizeDraftAtom, null)
      store.set(resizeShapeCommand, geometryById)

      dragRef.current = null
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      if (dragRef.current) {
        store.set(resizeDraftAtom, null)
        dragRef.current = null
      }
    }
  }, [store, svgRef])

  const onHandlePointerDown = useCallback(
    (handle: HandlePosition, bbox: Rect, e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.stopPropagation()
      e.preventDefault()

      const svg = svgRef.current
      if (!svg) return

      const point = screenToViewBox(svg, e.clientX, e.clientY)
      const shapes = store.get(selectedShapesAtom)
      if (shapes.length === 0) return

      e.currentTarget.setPointerCapture(e.pointerId)

      dragRef.current = {
        pointerId: e.pointerId,
        handle,
        anchor: anchorForHandle(handle, bbox),
        startPoint: point,
        startBbox: bbox,
        shapes,
      }
    },
    [store, svgRef],
  )

  return { onHandlePointerDown }
}
