import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { DraftLayer } from '@/features/canvas/DraftLayer'
import { MarqueeOverlay } from '@/features/canvas/MarqueeOverlay'
import { ShapeRenderer } from '@/features/canvas/renderers/ShapeRenderer'
import { SelectionOverlay } from '@/features/canvas/SelectionOverlay'
import { useToolPointerBridge } from '@/features/canvas/useToolPointerBridge'
import { useToolLifecycle } from '@/features/toolbar/useToolLifecycle'
import { cn } from '@/lib/utils'
import { CANVAS_SIZE } from '@/store/atoms/canvas'
import { documentAtom, shapeAtomsAtom } from '@/store/atoms/document'
import { isMovingAtom } from '@/store/atoms/move-draft'

// Pre-join so the stage only re-renders on actual viewBox changes; strings
// compare by value, sidestepping the fresh-array-per-immer-update trap.
const viewBoxStringAtom = selectAtom(documentAtom, (doc) => doc.viewBox.join(' '))

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
      className={cn(
        'border-border bg-background block border',
        isMoving ? 'cursor-move' : tool?.cursorClass,
      )}
      {...handlers}
    >
      {shapeAtoms.map((atom) => (
        <ShapeRenderer key={String(atom)} shapeAtom={atom} />
      ))}
      <DraftLayer />
      <SelectionOverlay svgRef={svgRef} />
      <MarqueeOverlay />
    </svg>
  )
}
