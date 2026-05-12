import { useAtomValue } from 'jotai'

import type { Rect } from '@/lib/geometry/rect'
import { viewBoxScaleAtom } from '@/store/atoms/canvas'
import { displayedSelectionBboxAtom } from '@/store/atoms/resize-draft'

import { type HandlePosition, useResizeGesture } from './useResizeGesture'

const CURSOR: Record<HandlePosition, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
}

function handlePositions(bbox: Rect) {
  const { x, y, width, height } = bbox
  const mx = x + width / 2
  const my = y + height / 2
  const ex = x + width
  const ey = y + height

  return [
    { pos: 'nw' as const, cx: x, cy: y },
    { pos: 'n' as const, cx: mx, cy: y },
    { pos: 'ne' as const, cx: ex, cy: y },
    { pos: 'e' as const, cx: ex, cy: my },
    { pos: 'se' as const, cx: ex, cy: ey },
    { pos: 's' as const, cx: mx, cy: ey },
    { pos: 'sw' as const, cx: x, cy: ey },
    { pos: 'w' as const, cx: x, cy: my },
  ]
}

export function ResizeHandles({ svgRef }: { svgRef: React.RefObject<SVGSVGElement | null> }) {
  const bbox = useAtomValue(displayedSelectionBboxAtom)
  const viewBoxScale = useAtomValue(viewBoxScaleAtom)
  const { onHandlePointerDown } = useResizeGesture(svgRef)

  if (!bbox) return null

  const visualRadius = 4 / viewBoxScale
  const hitRadius = visualRadius * 2

  return (
    <g data-testid="resize-handles">
      {handlePositions(bbox).map(({ pos, cx, cy }) => (
        <g key={pos}>
          <circle
            data-handle={pos}
            cx={cx}
            cy={cy}
            r={visualRadius}
            className="fill-background stroke-primary stroke-2"
            vectorEffect="non-scaling-stroke"
            style={{ cursor: CURSOR[pos] }}
            pointerEvents="none"
          />
          <circle
            data-handle-hit={pos}
            cx={cx}
            cy={cy}
            r={hitRadius}
            fill="transparent"
            style={{ cursor: CURSOR[pos] }}
            onPointerDown={(e) => {
              onHandlePointerDown(pos, bbox, e)
            }}
          />
        </g>
      ))}
    </g>
  )
}
