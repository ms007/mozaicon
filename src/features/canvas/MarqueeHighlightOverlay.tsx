import { useAtomValue } from 'jotai'

import { bboxOf } from '@/lib/svg/bbox'
import { shapeAtom } from '@/store/atoms/document'
import { highlightedShapeIdsAtom } from '@/store/atoms/marquee-draft'

export function MarqueeHighlightOverlay() {
  const ids = useAtomValue(highlightedShapeIdsAtom)

  if (ids.length === 0) return null

  return (
    <g data-testid="marquee-highlights">
      {ids.map((id) => (
        <ShapeHighlight key={id} shapeId={id} />
      ))}
    </g>
  )
}

function ShapeHighlight({ shapeId }: { shapeId: string }) {
  const shape = useAtomValue(shapeAtom(shapeId))
  if (!shape) return null
  const bbox = bboxOf(shape)

  return (
    <rect
      data-testid={`marquee-highlight-${shapeId}`}
      x={bbox.x}
      y={bbox.y}
      width={bbox.width}
      height={bbox.height}
      className="stroke-primary"
      fill="none"
      strokeWidth={1.5}
      vectorEffect="non-scaling-stroke"
      pointerEvents="none"
    />
  )
}
