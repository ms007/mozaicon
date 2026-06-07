import { useStore } from 'jotai'
import { useCallback, useRef } from 'react'

import { DRAG_THRESHOLD_PX, screenDistance } from '@/lib/geometry/distance'
import type { Vec2 } from '@/lib/geometry/vec2'
import { isSelectable } from '@/lib/selection'
import {
  createGestureSampler,
  type FrameScheduler,
  type GestureSampler,
  rafScheduler,
} from '@/lib/svg/gestureSampler'
import { shapeAtom } from '@/store/atoms/document'
import { moveDraftAtom } from '@/store/atoms/gestures/move'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { moveSelectionCommand } from '@/store/commands/moveSelection'
import { selectShapesCommand, toggleSelectionCommand } from '@/store/commands/selectionCommands'

import { computeMoveDraft } from './computeMoveDraft'

type Store = ReturnType<typeof useStore>

type DragState = {
  startScreen: Vec2
  startViewBox: Vec2
  shiftKey: boolean
  promoted: boolean
  moveIds: string[] | null
  draftWritten: boolean
}

function applyShapeClick(store: Store, shapeId: string, shiftKey: boolean) {
  if (shiftKey) {
    store.set(toggleSelectionCommand, shapeId)
    return
  }
  const currentIds = store.get(selectedIdsAtom)
  if (currentIds.length === 1 && currentIds[0] === shapeId) return
  store.set(selectShapesCommand, [shapeId])
}

function releaseCapture(e: React.PointerEvent) {
  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId)
  }
}

export function useShapeInteraction(shapeId: string, scheduler: FrameScheduler = rafScheduler) {
  const store = useStore()
  const dragRef = useRef<DragState | null>(null)
  const samplerRef = useRef<GestureSampler | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return

      e.stopPropagation()

      const shape = store.get(shapeAtom(shapeId))
      if (!shape || !isSelectable(shape)) return

      const svg = (e.target as SVGElement).ownerSVGElement
      if (!svg) return

      e.currentTarget.setPointerCapture(e.pointerId)

      const sampler = createGestureSampler(svg, scheduler)
      samplerRef.current = sampler
      const vb = sampler.toViewBox({ x: e.clientX, y: e.clientY })

      dragRef.current = {
        startScreen: { x: e.clientX, y: e.clientY },
        startViewBox: vb,
        shiftKey: e.shiftKey,
        promoted: false,
        moveIds: null,
        draftWritten: false,
      }
    },
    [store, shapeId, scheduler],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const state = dragRef.current
      const sampler = samplerRef.current
      if (!state || !sampler) return

      if (state.promoted && state.draftWritten && store.get(moveDraftAtom) === null) {
        dragRef.current = null
        samplerRef.current = null
        sampler.stop()
        releaseCapture(e)
        return
      }

      if (!state.promoted) {
        const dist = screenDistance(state.startScreen, { x: e.clientX, y: e.clientY })
        if (dist < DRAG_THRESHOLD_PX) return
      }

      if (!state.promoted) {
        const isSelected = store.get(selectedIdsAtom).includes(shapeId)
        if (!isSelected) applyShapeClick(store, shapeId, state.shiftKey)

        const moveIds = store.get(selectedIdsAtom).filter((id) => {
          const s = store.get(shapeAtom(id))
          return s && isSelectable(s)
        })

        if (moveIds.length === 0) return

        state.promoted = true
        state.moveIds = moveIds
      }

      const ids = state.moveIds
      if (!ids) return

      const startViewBox = state.startViewBox
      sampler.schedule(
        { x: e.clientX, y: e.clientY },
        { shift: e.shiftKey, alt: e.altKey },
        (sample) => {
          const { dx, dy } = computeMoveDraft(startViewBox, sample.point, sample.modifiers.shift)
          store.set(moveDraftAtom, { ids, dx, dy })
          state.draftWritten = true
        },
      )
    },
    [store, shapeId],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const state = dragRef.current
      const sampler = samplerRef.current
      if (!state) return
      dragRef.current = null
      samplerRef.current = null

      if (sampler) sampler.stop()
      releaseCapture(e)

      if (!state.promoted) {
        const shape = store.get(shapeAtom(shapeId))
        if (!shape || !isSelectable(shape)) return
        applyShapeClick(store, shapeId, state.shiftKey)
        return
      }

      const ids = state.moveIds
      if (!ids || !sampler) return

      if (state.draftWritten && store.get(moveDraftAtom) === null) {
        return
      }

      const releasePoint = sampler.toViewBox({ x: e.clientX, y: e.clientY })
      const { dx, dy } = computeMoveDraft(state.startViewBox, releasePoint, e.shiftKey)

      store.set(moveDraftAtom, null)

      if (dx !== 0 || dy !== 0) {
        store.set(moveSelectionCommand, { ids, dx, dy })
      }
    },
    [store, shapeId],
  )

  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return
      dragRef.current = null
      const sampler = samplerRef.current
      samplerRef.current = null
      if (sampler) sampler.stop()
      releaseCapture(e)
      store.set(moveDraftAtom, null)
    },
    [store],
  )

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
