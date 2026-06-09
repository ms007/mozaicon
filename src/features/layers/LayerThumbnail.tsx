import { bboxOf } from '@/lib/svg/bbox'
import { chooseRectElement } from '@/lib/svg/rectElement'
import type { Shape } from '@/types/shapes'

interface LayerThumbnailProps {
  shape: Shape
}

const PADDING = 1

function renderSilhouette(shape: Shape) {
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  switch (shape.type) {
    case 'rect': {
      const element = chooseRectElement(shape)
      return element.tag === 'path' ? (
        <path d={element.attrs.d} fill="currentColor" />
      ) : (
        <rect {...element.attrs} fill="currentColor" />
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
