import { DRAG_THRESHOLD_PX, screenDistance } from '@/lib/geometry/distance'
import type { Vec2 } from '@/lib/geometry/vec2'
import { newId } from '@/lib/ids'
import {
  activeDragAtom,
  cancelDraftAtom,
  DRAFT_SHAPE_ID,
  draftShapeAtom,
} from '@/store/atoms/draft'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { type StyleDefaults, styleDefaultsAtom } from '@/store/atoms/style-defaults'
import { addShapeCommand, type AddShapePayload, materializeShape } from '@/store/commands/addShape'

import type { DrawTool, Modifiers } from './registry'

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

  const tool: DrawTool = {
    id: config.toolId,
    cursorClass: config.cursorClass,

    onPointerDown(ctx, event) {
      if (event.buttons !== 1) return

      const existing = ctx.store.get(activeDragAtom)
      if (existing) return

      lastGeometry = null
      ctx.store.set(activeDragAtom, {
        toolId: config.toolId,
        pointerId: event.pointerId,
        startViewBox: event.point,
        startScreen: event.screenPoint,
      })
    },

    onPointerMove(ctx, event) {
      const drag = ctx.store.get(activeDragAtom)
      if (!drag) return
      if (event.pointerId !== drag.pointerId) return

      const dist = screenDistance(drag.startScreen, event.screenPoint)
      if (dist < DRAG_THRESHOLD_PX) return

      const geo = config.geometryFromDrag(drag.startViewBox, event.point, event.modifiers)

      if (lastGeometry && config.geometryEquals(lastGeometry, geo)) return

      lastGeometry = geo

      const styles = ctx.store.get(styleDefaultsAtom)
      const shapeData = config.buildShape(geo, styles)
      ctx.store.set(draftShapeAtom, materializeShape({ ...shapeData, id: DRAFT_SHAPE_ID }))
    },

    onPointerUp(ctx, event) {
      const drag = ctx.store.get(activeDragAtom)
      if (drag && event.pointerId !== drag.pointerId) return

      if (drag) {
        const dist = screenDistance(drag.startScreen, event.screenPoint)
        const isClick = dist < DRAG_THRESHOLD_PX

        const geo: G = isClick
          ? config.clickFallbackGeometry(drag.startViewBox)
          : config.geometryFromDrag(drag.startViewBox, event.point, event.modifiers)
        const id = newId()
        const styles = ctx.store.get(styleDefaultsAtom)
        ctx.store.set(addShapeCommand, { ...config.buildShape(geo, styles), id })
        ctx.store.set(selectedIdsAtom, [id])

        ctx.store.set(cancelDraftAtom)
        lastGeometry = null
      }
    },

    onDeactivate(ctx) {
      ctx.store.set(cancelDraftAtom)
      lastGeometry = null
    },

    shouldHandlePointerMove(ctx) {
      return !!ctx.store.get(activeDragAtom)
    },
  }

  return tool
}
