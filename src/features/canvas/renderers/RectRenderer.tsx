import { isUniform, roundedRectPath } from '@/lib/geometry/corner-radius'
import type { RectShape } from '@/types/shapes'

export function RectRenderer({ shape }: { shape: RectShape }) {
  const fill = shape.fill ?? '#000'

  if (shape.radii && !isUniform(shape.radii)) {
    const d = roundedRectPath(shape.x, shape.y, shape.width, shape.height, shape.radii)
    return <path d={d} fill={fill} />
  }

  const rx = shape.radii ? shape.radii[0] : shape.rx
  return (
    <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={rx} fill={fill} />
  )
}
