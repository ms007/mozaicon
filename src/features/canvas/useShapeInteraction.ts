import { useStore } from 'jotai'
import { useCallback, useRef } from 'react'

import { DRAG_THRESHOLD_PX, screenDistance } from '@/lib/geometry/distance'
import type { Vec2 } from '@/lib/geometry/vec2'
import { isSelectable } from '@/lib/selection'
import { screenToViewBox } from '@/lib/svg/screenToViewBox'
import { shapeAtom } from '@/store/atoms/document'
import { moveDraftAtom } from '@/store/atoms/move-draft'
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

export function useShapeInteraction(shapeId: string) {
  const store = useStore()
  const dragRef = useRef<DragState | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return

      e.stopPropagation()

      const shape = store.get(shapeAtom(shapeId))
      if (!shape || !isSelectable(shape)) return

      e.currentTarget.setPointerCapture(e.pointerId)

      const svg = (e.target as SVGElement).ownerSVGElement
      const vb = svg ? screenToViewBox(svg, e.clientX, e.clientY) : { x: e.clientX, y: e.clientY }

      dragRef.current = {
        startScreen: { x: e.clientX, y: e.clientY },
        startViewBox: vb,
        shiftKey: e.shiftKey,
        promoted: false,
        moveIds: null,
      }
    },
    [store, shapeId],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const state = dragRef.current
      if (!state) return

      if (state.promoted && store.get(moveDraftAtom) === null) {
        dragRef.current = null
        releaseCapture(e)
        return
      }

      if (!state.promoted) {
        const dist = screenDistance(state.startScreen, { x: e.clientX, y: e.clientY })
        if (dist < DRAG_THRESHOLD_PX) return
      }

      const svg = (e.target as SVGElement).ownerSVGElement
      if (!svg) return
      const current = screenToViewBox(svg, e.clientX, e.clientY)

      if (!state.promoted) {
        const isSelected = store.get(selectedIdsAtom).includes(shapeId)
        if (!isSelected) applyShapeClick(store, shapeId, state.shiftKey)

        const moveIds = store.get(selectedIdsAtom).filter((id) => {
          const s = store.get(shapeAtom(id))
          return s && s.visible && !s.locked
        })

        if (moveIds.length === 0) return

        state.promoted = true
        state.moveIds = moveIds
      }

      const ids = state.moveIds
      if (!ids) return

      const { dx, dy } = computeMoveDraft(state.startViewBox, current, e.shiftKey)

      store.set(moveDraftAtom, { ids, dx, dy })
    },
    [store, shapeId],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const state = dragRef.current
      if (!state) return
      dragRef.current = null

      releaseCapture(e)

      if (!state.promoted) {
        const shape = store.get(shapeAtom(shapeId))
        if (!shape || !isSelectable(shape)) return
        applyShapeClick(store, shapeId, state.shiftKey)
        return
      }

      const draft = store.get(moveDraftAtom)
      store.set(moveDraftAtom, null)

      if (draft && (draft.dx !== 0 || draft.dy !== 0)) {
        store.set(moveSelectionCommand, { ids: draft.ids, dx: draft.dx, dy: draft.dy })
      }
    },
    [store, shapeId],
  )

  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return
      dragRef.current = null
      releaseCapture(e)
      store.set(moveDraftAtom, null)
    },
    [store],
  )

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
