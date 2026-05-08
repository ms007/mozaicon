import type { Vec2 } from '@/lib/geometry/vec2'
import { newId } from '@/lib/ids'
import { activeDragAtom, DRAFT_SHAPE_ID, draftShapeAtom } from '@/store/atoms/draft'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { addShapeCommand } from '@/store/commands/addShape'

import type { DrawTool, Modifiers } from './registry'

// 3 screen-pixels — below this the gesture is a click, not a drag.
const DRAG_THRESHOLD_PX = 3

const DEFAULT_SIZE = 4
const DEFAULT_FILL = '#000'
const RECT_TOOL_ID = 'rect'

type RectGeometry = { x: number; y: number; width: number; height: number }

export function geometryFromDrag(start: Vec2, end: Vec2, modifiers: Modifiers): RectGeometry {
  let dx = end.x - start.x
  let dy = end.y - start.y

  if (modifiers.shift) {
    const size = Math.max(Math.abs(dx), Math.abs(dy))
    dx = Math.sign(dx || 1) * size
    dy = Math.sign(dy || 1) * size
  }

  if (modifiers.alt) {
    return {
      x: start.x - Math.abs(dx),
      y: start.y - Math.abs(dy),
      width: Math.max(1, 2 * Math.abs(dx)),
      height: Math.max(1, 2 * Math.abs(dy)),
    }
  }

  return {
    x: Math.min(start.x, start.x + dx),
    y: Math.min(start.y, start.y + dy),
    width: Math.max(1, Math.abs(dx)),
    height: Math.max(1, Math.abs(dy)),
  }
}

function screenDistance(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function sameGeometry(a: RectGeometry, b: RectGeometry): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

export const rectTool: DrawTool = {
  id: RECT_TOOL_ID,
  cursorClass: 'cursor-crosshair',

  onPointerDown(ctx, event) {
    if (event.buttons !== 1) return

    const existing = ctx.store.get(activeDragAtom)
    if (existing) return

    ctx.store.set(activeDragAtom, {
      toolId: RECT_TOOL_ID,
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

    const geo = geometryFromDrag(drag.startViewBox, event.point, event.modifiers)

    // Skip the write when geometry hasn't changed — avoids a DraftLayer re-render
    // on no-op pointermove events (sub-pixel jitter, repeated frames).
    const prev = ctx.store.get(draftShapeAtom)
    if (prev && sameGeometry(prev, geo)) return

    ctx.store.set(draftShapeAtom, {
      type: 'rect',
      id: DRAFT_SHAPE_ID,
      name: 'Rect',
      visible: true,
      locked: false,
      fill: DEFAULT_FILL,
      ...geo,
    })
  },

  onPointerUp(ctx, event) {
    const drag = ctx.store.get(activeDragAtom)
    if (!drag) return
    if (event.pointerId !== drag.pointerId) return

    const dist = screenDistance(drag.startScreen, event.screenPoint)
    const geo: RectGeometry =
      dist < DRAG_THRESHOLD_PX
        ? {
            x: drag.startViewBox.x,
            y: drag.startViewBox.y,
            width: DEFAULT_SIZE,
            height: DEFAULT_SIZE,
          }
        : geometryFromDrag(drag.startViewBox, event.point, event.modifiers)

    const id = newId()
    ctx.store.set(addShapeCommand, { id, ...geo, fill: DEFAULT_FILL })
    ctx.store.set(selectedIdsAtom, [id])
    ctx.store.set(draftShapeAtom, null)
    ctx.store.set(activeDragAtom, null)
  },
}
