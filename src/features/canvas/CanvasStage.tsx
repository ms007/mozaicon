import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { DraftLayer } from '@/features/canvas/DraftLayer'
import { MarqueeHighlightOverlay } from '@/features/canvas/MarqueeHighlightOverlay'
import { MarqueeOverlay } from '@/features/canvas/MarqueeOverlay'
import { PixelGrid } from '@/features/canvas/PixelGrid'
import { ShapeRenderer } from '@/features/canvas/renderers/ShapeRenderer'
import { SelectionOverlay } from '@/features/canvas/SelectionOverlay'
import { useToolPointerBridge } from '@/features/canvas/useToolPointerBridge'
import { useToolLifecycle } from '@/features/toolbar/useToolLifecycle'
import { cn } from '@/lib/utils'
import { CANVAS_SIZE, viewBoxAtom } from '@/store/atoms/canvas'
import { shapeAtomsAtom } from '@/store/atoms/document'
import { isMovingAtom } from '@/store/atoms/move-draft'

// Pre-join so the stage only re-renders on actual viewBox changes; strings
// compare by value, sidestepping the fresh-array-per-immer-update trap.
const viewBoxStringAtom = selectAtom(viewBoxAtom, (vb) => vb.join(' '))

export function CanvasStage() {
  const viewBox = useAtomValue(viewBoxStringAtom)
  const shapeAtoms = useAtomValue(shapeAtomsAtom)
  const isMoving = useAtomValue(isMovingAtom)
  const tool = useToolLifecycle()
  const { svgRef, handlers } = useToolPointerBridge(tool)

  return (
    <svg
      ref={svgRef}
      aria-label="Icon canvas"
      role="img"
      viewBox={viewBox}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className={cn('bg-card block', isMoving ? 'cursor-move' : tool?.cursorClass)}
      overflow="visible"
      {...handlers}
    >
      <PixelGrid />
      {shapeAtoms.map((atom) => (
        <ShapeRenderer key={String(atom)} shapeAtom={atom} />
      ))}
      <DraftLayer />
      <MarqueeHighlightOverlay />
      <SelectionOverlay svgRef={svgRef} />
      <MarqueeOverlay />
    </svg>
  )
}
