import { DRAG_THRESHOLD_PX, screenDistance } from '@/lib/geometry/distance'
import type { Vec2 } from '@/lib/geometry/vec2'
import { newId } from '@/lib/ids'
import { cancelDraftAtom, DRAFT_SHAPE_ID, draftShapeAtom } from '@/store/atoms/draft'
import { type StyleDefaults, styleDefaultsAtom } from '@/store/atoms/style-defaults'
import { addShapeCommand, type AddShapePayload, materializeShape } from '@/store/commands/addShape'

import type { DrawTool, Modifiers } from './registry'

type ClosureDrag = {
  pointerId: number
  startViewBox: Vec2
  startScreen: Vec2
}

export type DragToolConfig<G> = {
  toolId: string
  cursorClass: string
  geometryFromDrag: (start: Vec2, end: Vec2, modifiers: Modifiers) => G
  clickFallbackGeometry: (point: Vec2) => G
  geometryEquals: (a: G, b: G) => boolean
  buildShape: (geometry: G, styles: StyleDefaults) => Omit<AddShapePayload, 'id'>
}

export function createDragTool<G>(config: DragToolConfig<G>): DrawTool {
  let lastGeometry: G | null = null
  let activeDrag: ClosureDrag | null = null

  function resetClosure() {
    activeDrag = null
    lastGeometry = null
  }

  const tool: DrawTool = {
    id: config.toolId,
    cursorClass: config.cursorClass,

    onPointerDown(_ctx, event) {
      if (event.buttons !== 1) return
      if (activeDrag) {
        if (activeDrag.pointerId !== event.pointerId) return
        resetClosure()
      }

      activeDrag = {
        pointerId: event.pointerId,
        startViewBox: event.point,
        startScreen: event.screenPoint,
      }
    },

    onPointerMove(ctx, event) {
      if (!activeDrag) return
      if (event.pointerId !== activeDrag.pointerId) return

      if (lastGeometry && ctx.store.get(draftShapeAtom) === null) {
        resetClosure()
        return
      }

      const dist = screenDistance(activeDrag.startScreen, event.screenPoint)
      if (dist < DRAG_THRESHOLD_PX) return

      const geo = config.geometryFromDrag(activeDrag.startViewBox, event.point, event.modifiers)

      if (lastGeometry && config.geometryEquals(lastGeometry, geo)) return

      lastGeometry = geo

      const styles = ctx.store.get(styleDefaultsAtom)
      const shapeData = config.buildShape(geo, styles)
      ctx.store.set(draftShapeAtom, materializeShape({ ...shapeData, id: DRAFT_SHAPE_ID }))
    },

    onPointerUp(ctx, event) {
      if (!activeDrag) return
      if (event.pointerId !== activeDrag.pointerId) return

      const drag = activeDrag
      const draftWasBuilt = lastGeometry !== null
      resetClosure()

      if (draftWasBuilt && ctx.store.get(draftShapeAtom) === null) {
        return
      }

      const dist = screenDistance(drag.startScreen, event.screenPoint)
      const isClick = dist < DRAG_THRESHOLD_PX

      const geo: G = isClick
        ? config.clickFallbackGeometry(drag.startViewBox)
        : config.geometryFromDrag(drag.startViewBox, event.point, event.modifiers)
      const id = newId()
      const styles = ctx.store.get(styleDefaultsAtom)

      ctx.store.set(cancelDraftAtom)
      ctx.store.set(addShapeCommand, { ...config.buildShape(geo, styles), id })
    },

    onDeactivate(ctx) {
      resetClosure()
      ctx.store.set(cancelDraftAtom)
    },

    shouldHandlePointerMove() {
      return activeDrag !== null
    },
  }

  return tool
}
