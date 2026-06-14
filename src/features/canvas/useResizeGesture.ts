import { useStore } from 'jotai'
import { useCallback, useEffect, useRef } from 'react'

import { quantizeRect } from '@/lib/geometry/quantize'
import type { Rect } from '@/lib/geometry/rect'
import { scaleShape } from '@/lib/geometry/scale'
import type { Vec2 } from '@/lib/geometry/vec2'
import { bboxOf } from '@/lib/svg/bbox'
import { createGestureSampler, type GestureSampler, rafScheduler } from '@/lib/svg/gestureSampler'
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
    draft[shape.id] = quantizeRect(bboxOf(scaled))
  }
  return draft
}

export function useResizeGesture(svgRef: React.RefObject<SVGSVGElement | null>) {
  const store = useStore()
  const dragRef = useRef<DragState | null>(null)
  const samplerRef = useRef<GestureSampler | null>(null)

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (e.pointerId !== drag?.pointerId) return

      const sampler = samplerRef.current
      if (!sampler) return

      sampler.schedule(
        { x: e.clientX, y: e.clientY },
        { shift: e.shiftKey, alt: e.altKey },
        (sample) => {
          const currentDrag = dragRef.current
          if (!currentDrag) return
          const draft = computeResizeDraft(
            currentDrag.handle,
            currentDrag.startPoint,
            sample.point,
            currentDrag.startBbox,
            currentDrag.anchor,
            currentDrag.shapes,
            sample.modifiers,
          )
          store.set(resizeDraftAtom, draft)
        },
      )
    }

    const handleUp = (e: PointerEvent) => {
      const drag = dragRef.current
      if (e.pointerId !== drag?.pointerId) return

      const sampler = samplerRef.current
      if (!sampler) return

      sampler.stop()
      samplerRef.current = null

      const point = sampler.toViewBox({ x: e.clientX, y: e.clientY })
      const modifiers = { shift: e.shiftKey, alt: e.altKey }
      const geometryById = computeResizeDraft(
        drag.handle,
        drag.startPoint,
        point,
        drag.startBbox,
        drag.anchor,
        drag.shapes,
        modifiers,
      )
      store.set(resizeDraftAtom, null)
      store.set(resizeShapeCommand, geometryById)

      dragRef.current = null
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      if (samplerRef.current) {
        samplerRef.current.stop()
        samplerRef.current = null
      }
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

      const sampler = createGestureSampler(svg, rafScheduler)
      const point = sampler.toViewBox({ x: e.clientX, y: e.clientY })
      const shapes = store.get(selectedShapesAtom)
      if (shapes.length === 0) return

      e.currentTarget.setPointerCapture(e.pointerId)
      samplerRef.current = sampler

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
