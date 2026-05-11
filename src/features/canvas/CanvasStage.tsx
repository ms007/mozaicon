import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { DraftLayer } from '@/features/canvas/DraftLayer'
import { ShapeRenderer } from '@/features/canvas/renderers/ShapeRenderer'
import { SelectionOverlay } from '@/features/canvas/SelectionOverlay'
import { useToolPointerBridge } from '@/features/canvas/useToolPointerBridge'
import { useToolLifecycle } from '@/features/toolbar/useToolLifecycle'
import { cn } from '@/lib/utils'
import { documentAtom, shapeAtomsAtom } from '@/store/atoms/document'

const CANVAS_SIZE = 512

// Pre-join so the stage only re-renders on actual viewBox changes; strings
// compare by value, sidestepping the fresh-array-per-immer-update trap.
const viewBoxStringAtom = selectAtom(documentAtom, (doc) => doc.viewBox.join(' '))

export function CanvasStage() {
  const viewBox = useAtomValue(viewBoxStringAtom)
  const shapeAtoms = useAtomValue(shapeAtomsAtom)
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
      className={cn('border-border bg-background block border', tool?.cursorClass)}
      {...handlers}
    >
      {shapeAtoms.map((atom) => (
        <ShapeRenderer key={String(atom)} shapeAtom={atom} />
      ))}
      <DraftLayer />
      <SelectionOverlay />
    </svg>
  )
}
