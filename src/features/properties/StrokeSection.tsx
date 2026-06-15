import { useAtomValue, useSetAtom } from 'jotai'

import { PanelSection } from '@/components/PanelSection'
import { Button } from '@/components/primitives/Button'
import { colorSlotsAtom } from '@/store/atoms/colorSlots'
import { selectionStrokeAtom } from '@/store/atoms/selection-stroke'
import { addStrokeCommand } from '@/store/commands/addStroke'
import { removeStrokeCommand } from '@/store/commands/removeStroke'

import { PropertyRow } from './PropertyRow'
import { StrokeColorControl } from './StrokeColorControl'
import { StrokeWidthField } from './StrokeWidthField'

export function StrokeSection() {
  const stroke = useAtomValue(selectionStrokeAtom)
  const slots = useAtomValue(colorSlotsAtom)
  const addStroke = useSetAtom(addStrokeCommand)
  const removeStroke = useSetAtom(removeStrokeCommand)

  if (!stroke) return null

  const hasStroke = stroke.presence !== 'none'

  const headerAction = !hasStroke ? (
    <Button
      variant="ghost"
      size="icon"
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
      size="icon"
      aria-label="Remove stroke"
      onClick={() => {
        removeStroke(undefined)
      }}
    >
      −
    </Button>
  )

  return (
    <PanelSection title="Stroke" headerAction={headerAction} divided>
      {hasStroke && (
        <PropertyRow>
          <div className="grid grid-cols-2 gap-2">
            <StrokeColorControl />
            <StrokeWidthField />
          </div>
        </PropertyRow>
      )}
    </PanelSection>
  )
}
