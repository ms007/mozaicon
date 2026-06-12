import { useAtomValue, useSetAtom } from 'jotai'

import { PanelSection } from '@/components/PanelSection'
import { Button } from '@/components/primitives/Button'
import { strokeColorSlotsAtom } from '@/store/atoms/colorSlots'
import { selectionStrokeAtom } from '@/store/atoms/selection-stroke'
import { addStrokeCommand } from '@/store/commands/addStroke'
import { removeStrokeCommand } from '@/store/commands/removeStroke'

import { ColorSlots } from './ColorSlots'
import { StrokeWidthField } from './StrokeWidthField'

export function StrokeSection() {
  const stroke = useAtomValue(selectionStrokeAtom)
  const slots = useAtomValue(strokeColorSlotsAtom)
  const addStroke = useSetAtom(addStrokeCommand)
  const removeStroke = useSetAtom(removeStrokeCommand)

  if (!stroke) return null

  const hasStroke = stroke.presence !== 'none'

  const headerAction = !hasStroke ? (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Add stroke"
      onClick={() => {
        addStroke(slots.find((slot) => slot !== null) ?? undefined)
      }}
    >
      +
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Remove stroke"
      onClick={() => {
        removeStroke(undefined)
      }}
    >
      −
    </Button>
  )

  return (
    <PanelSection title="Stroke" headerAction={headerAction}>
      {hasStroke && (
        <>
          <div className="grid grid-cols-[1fr_auto] gap-1.5">
            <ColorSlots />
            <div aria-hidden className="w-6" />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-1.5">
            <StrokeWidthField />
            <div aria-hidden className="w-6" />
          </div>
        </>
      )}
    </PanelSection>
  )
}
