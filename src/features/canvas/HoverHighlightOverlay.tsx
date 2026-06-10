import { useAtomValue } from 'jotai'

import { bboxOf } from '@/lib/svg/bbox'
import { effectiveHoveredShapeIdAtom } from '@/store/atoms/hover'
import { shapeAtom } from '@/store/atoms/project'

export function HoverHighlightOverlay() {
  const id = useAtomValue(effectiveHoveredShapeIdAtom)

  if (id == null) return null

  return <HoverRect shapeId={id} />
}

function HoverRect({ shapeId }: { shapeId: string }) {
  const shape = useAtomValue(shapeAtom(shapeId))
  if (!shape) return null
  const bbox = bboxOf(shape)

  return (
    <rect
      data-testid="hover-highlight"
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
