import { useAtomValue } from 'jotai'

import { ResizeHandles } from '@/features/canvas/ResizeHandles'
import { displayedSelectionBboxFromRegistryAtom as displayedSelectionBboxAtom } from '@/store/atoms/gestures/registry'

export function SelectionOverlay({ svgRef }: { svgRef: React.RefObject<SVGSVGElement | null> }) {
  const bbox = useAtomValue(displayedSelectionBboxAtom)

  if (!bbox) return null

  return (
    <g>
      <rect
        data-testid="selection-overlay"
        x={bbox.x}
        y={bbox.y}
        width={bbox.width}
        height={bbox.height}
        className="stroke-primary"
        fill="none"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
      <ResizeHandles svgRef={svgRef} />
    </g>
  )
}
