import { useSetAtom, useStore } from 'jotai'
import { useCallback, useRef } from 'react'

import type { DrawTool, ToolCtx, ToolEvent } from '@/features/toolbar/tools/registry'
import { DRAG_THRESHOLD_PX, screenDistance } from '@/lib/geometry/distance'
import type { FrameScheduler, GestureSampler } from '@/lib/svg/gestureSampler'
import { createGestureSampler, rafScheduler } from '@/lib/svg/gestureSampler'
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

function makeToolEvent(
  svg: SVGSVGElement,
  e: React.PointerEvent,
  sampler?: GestureSampler | null,
): ToolEvent {
  const point = sampler
    ? sampler.toViewBox({ x: e.clientX, y: e.clientY })
    : screenToViewBox(svg, e.clientX, e.clientY)
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
  scheduler: FrameScheduler = rafScheduler,
): PointerHandlers {
  const store = useStore()
  const cancelDraft = useSetAtom(cancelDraftAtom)
  const samplerRef = useRef<GestureSampler | null>(null)

  const makeCtx = useCallback(
    (): ToolCtx => ({
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

      samplerRef.current?.stop()
      const sampler = createGestureSampler(svg, scheduler)
      samplerRef.current = sampler

      if (!tool) {
        const vb = sampler.toViewBox({ x: e.clientX, y: e.clientY })
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
      tool.onPointerDown(makeCtx(), makeToolEvent(svg, e, sampler))
    },
    [tool, store, svgRef, scheduler, makeCtx],
  )

  const latestMoveRef = useRef<{
    meta: boolean
    ctrl: boolean
    pointerId: number
    buttons: number
    screenX: number
    screenY: number
  } | null>(null)

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const sampler = samplerRef.current
      if (!tool) {
        const draft = store.get(marqueeDraftAtom)
        if (!draft || !sampler) return
        sampler.schedule(
          { x: e.clientX, y: e.clientY },
          { shift: e.shiftKey, alt: e.altKey },
          (sample) => {
            const currentDraft = store.get(marqueeDraftAtom)
            if (!currentDraft) return
            if (
              sample.point.x === currentDraft.current.x &&
              sample.point.y === currentDraft.current.y
            )
              return
            store.set(marqueeDraftAtom, { ...currentDraft, current: sample.point })
          },
        )
        return
      }
      if (tool.shouldHandlePointerMove && !tool.shouldHandlePointerMove(makeCtx())) return
      if (!sampler) {
        const svg = svgRef.current
        if (!svg) return
        tool.onPointerMove(makeCtx(), makeToolEvent(svg, e))
        return
      }
      latestMoveRef.current = {
        meta: e.metaKey,
        ctrl: e.ctrlKey,
        pointerId: e.pointerId,
        buttons: e.buttons,
        screenX: e.clientX,
        screenY: e.clientY,
      }
      sampler.schedule(
        { x: e.clientX, y: e.clientY },
        { shift: e.shiftKey, alt: e.altKey },
        (sample) => {
          const extra = latestMoveRef.current
          if (!extra) return
          const event: ToolEvent = {
            point: sample.point,
            screenPoint: { x: extra.screenX, y: extra.screenY },
            modifiers: {
              shift: sample.modifiers.shift,
              alt: sample.modifiers.alt,
              meta: extra.meta,
              ctrl: extra.ctrl,
            },
            pointerId: extra.pointerId,
            buttons: extra.buttons,
          }
          tool.onPointerMove(makeCtx(), event)
        },
      )
    },
    [tool, store, svgRef, makeCtx],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const svg = svgRef.current
      const target = e.currentTarget
      const sampler = samplerRef.current
      try {
        if (!svg) return
        if (sampler) sampler.stop()

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
            const releasePoint = sampler
              ? sampler.toViewBox({ x: e.clientX, y: e.clientY })
              : screenToViewBox(svg, e.clientX, e.clientY)
            store.set(marqueeDraftAtom, { ...draft, current: releasePoint })
            const ids = store.get(previewSelectedIdsAtom)
            store.set(marqueeDraftAtom, null)
            store.set(selectShapesCommand, ids)
          }
          return
        }
        tool.onPointerUp(makeCtx(), makeToolEvent(svg, e, sampler))
      } finally {
        samplerRef.current = null
        if (target.hasPointerCapture(e.pointerId)) {
          target.releasePointerCapture(e.pointerId)
        }
      }
    },
    [tool, store, svgRef, makeCtx],
  )

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      const sampler = samplerRef.current
      if (sampler) {
        sampler.stop()
        samplerRef.current = null
      }
      cancelDraft()
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    },
    [cancelDraft],
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (tool?.shouldHandlePointerMove?.(makeCtx())) {
        e.preventDefault()
      }
    },
    [tool, makeCtx],
  )

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onContextMenu: handleContextMenu,
  }
}
