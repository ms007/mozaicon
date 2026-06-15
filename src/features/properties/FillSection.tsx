import { useAtomValue, useSetAtom } from 'jotai'

import { PanelSection } from '@/components/PanelSection'
import { Button } from '@/components/primitives/Button'
import { colorSlotsAtom } from '@/store/atoms/colorSlots'
import { selectionFillAtom } from '@/store/atoms/selection-fill'
import { addFillCommand } from '@/store/commands/addFill'
import { removeFillCommand } from '@/store/commands/removeFill'

import { FillColorControl } from './FillColorControl'
import { PropertyRow } from './PropertyRow'

export function FillSection() {
  const fill = useAtomValue(selectionFillAtom)
  const slots = useAtomValue(colorSlotsAtom)
  const addFill = useSetAtom(addFillCommand)
  const removeFill = useSetAtom(removeFillCommand)

  if (!fill) return null

  const hasFill = fill.presence !== 'none'

  const headerAction = !hasFill ? (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Add fill"
      onClick={() => {
        addFill(slots.find((slot) => slot !== null) ?? undefined)
      }}
    >
      +
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Remove fill"
      onClick={() => {
        removeFill(undefined)
      }}
    >
      −
    </Button>
  )

  return (
    <PanelSection title="Fill" headerAction={headerAction} divided>
      {hasFill && (
        <PropertyRow>
          <FillColorControl />
        </PropertyRow>
      )}
    </PanelSection>
  )
}
