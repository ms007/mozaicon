import { chooseRectElement } from '@/lib/svg/rectElement'
import { shapePaintAttrs } from '@/lib/svg/shapeElement'
import type { RectShape } from '@/types/shapes'

export function RectRenderer({ shape }: { shape: RectShape }) {
  const el = chooseRectElement(shape)
  const paint = shapePaintAttrs(shape)

  if (el.tag === 'path') {
    return <path d={el.attrs.d} {...paint} />
  }

  return <rect {...el.attrs} {...paint} />
}
