import { isUniform, roundedRectPath } from '@/lib/geometry/corner-radius'
import { bboxOf } from '@/lib/svg/bbox'
import type { Shape } from '@/types/shapes'

interface LayerThumbnailProps {
  shape: Shape
}

const PADDING = 1

function renderSilhouette(shape: Shape) {
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  switch (shape.type) {
    case 'rect': {
      if (shape.radii && !isUniform(shape.radii)) {
        const d = roundedRectPath(shape.x, shape.y, shape.width, shape.height, shape.radii)
        return <path d={d} fill="currentColor" />
      }
      const rx = shape.radii ? shape.radii[0] : shape.rx
      return (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rx={rx}
          fill="currentColor"
        />
      )
    }
  }
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}

export function LayerThumbnail({ shape }: LayerThumbnailProps) {
  const bb = bboxOf(shape)
  const vb = [bb.x - PADDING, bb.y - PADDING, bb.width + PADDING * 2, bb.height + PADDING * 2].join(
    ' ',
  )
  return (
    <svg
      aria-hidden
      className="text-muted-foreground size-4 shrink-0"
      viewBox={vb}
      preserveAspectRatio="xMidYMid meet"
    >
      {renderSilhouette(shape)}
    </svg>
  )
}
