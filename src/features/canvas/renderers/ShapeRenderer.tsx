import { type PrimitiveAtom, useAtomValue } from 'jotai'

import { useShapeInteraction } from '@/features/canvas/useShapeInteraction'
import { assertNever } from '@/lib/util/assertNever'
import { cornerRadiusStepDraftForShapeAtom } from '@/store/atoms/gestures/cornerRadiusStep'
import { moveDraftForShapeAtom } from '@/store/atoms/gestures/move'
import { nudgeDraftForShapeAtom } from '@/store/atoms/gestures/nudge'
import { propertyStepDraftForShapeAtom } from '@/store/atoms/gestures/propertyStep'
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
  const propStepGeo = useAtomValue(propertyStepDraftForShapeAtom(shape.id))
  const radiusStepDraft = useAtomValue(cornerRadiusStepDraftForShapeAtom(shape.id))
  const moveOffset = useAtomValue(moveDraftForShapeAtom(shape.id))
  const nudgeOffset = useAtomValue(nudgeDraftForShapeAtom(shape.id))
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useShapeInteraction(
    shape.id,
  )

  if (!shape.visible) return null

  const geoOverride = draftGeo ?? propStepGeo
  let rendered = geoOverride ? { ...shape, ...geoOverride } : shape
  if (radiusStepDraft) {
    rendered = { ...rendered, radii: radiusStepDraft }
  }
  const totalDx = (moveOffset?.dx ?? 0) + (nudgeOffset?.dx ?? 0)
  const totalDy = (moveOffset?.dy ?? 0) + (nudgeOffset?.dy ?? 0)
  const transform =
    totalDx !== 0 || totalDy !== 0 ? `translate(${String(totalDx)} ${String(totalDy)})` : undefined

  return (
    <g
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      transform={transform}
    >
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
