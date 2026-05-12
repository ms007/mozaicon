import { type PrimitiveAtom, useAtomValue } from 'jotai'

import { useClickToSelect } from '@/features/canvas/useClickToSelect'
import { assertNever } from '@/lib/util/assertNever'
import { resizeDraftForShapeAtom } from '@/store/atoms/resize-draft'
import type { Shape } from '@/types/shapes'

import { RectRenderer } from './RectRenderer'

type ShapeRendererProps =
  | { shapeAtom: PrimitiveAtom<Shape>; shape?: never }
  | { shape: Shape; shapeAtom?: never }

export function ShapeRenderer(props: ShapeRendererProps) {
  if (props.shapeAtom) {
    return <AtomShapeRenderer shapeAtom={props.shapeAtom} />
  }
  return <ValueShapeRenderer shape={props.shape} />
}

function AtomShapeRenderer({ shapeAtom }: { shapeAtom: PrimitiveAtom<Shape> }) {
  const shape = useAtomValue(shapeAtom)
  const draftGeo = useAtomValue(resizeDraftForShapeAtom(shape.id))
  const { onPointerDown } = useClickToSelect(shape.id)

  const rendered = draftGeo ? { ...shape, ...draftGeo } : shape

  return (
    <g onPointerDown={onPointerDown}>
      <ValueShapeRenderer shape={rendered} />
    </g>
  )
}

function ValueShapeRenderer({ shape }: { shape: Shape }) {
  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  switch (shape.type) {
    case 'rect':
      return <RectRenderer shape={shape} />
    default:
      return assertNever(shape.type)
  }
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}
