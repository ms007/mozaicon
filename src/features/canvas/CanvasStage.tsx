import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { DraftLayer } from '@/features/canvas/DraftLayer'
import { MarqueeHighlightOverlay } from '@/features/canvas/MarqueeHighlightOverlay'
import { MarqueeOverlay } from '@/features/canvas/MarqueeOverlay'
import { PixelGrid } from '@/features/canvas/PixelGrid'
import { ShapeRenderer } from '@/features/canvas/renderers/ShapeRenderer'
import { SelectionOverlay } from '@/features/canvas/SelectionOverlay'
import { CANVAS_SIZE, viewBoxAtom } from '@/store/atoms/canvas'
import { shapeAtomsAtom } from '@/store/atoms/document'

const viewBoxStringAtom = selectAtom(viewBoxAtom, (vb) => vb.join(' '))

export function CanvasStage({ svgRef }: { svgRef: React.RefObject<SVGSVGElement | null> }) {
  const viewBox = useAtomValue(viewBoxStringAtom)
  const shapeAtoms = useAtomValue(shapeAtomsAtom)

  return (
    <svg
      ref={svgRef}
      aria-label="Icon canvas"
      role="img"
      viewBox={viewBox}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className="bg-card block"
      overflow="visible"
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
