import { colorSlotsAtom } from '@/store/atoms/colorSlots'
import { selectionFillAtom } from '@/store/atoms/selection-fill'

import { ColorControl } from './ColorControl'
import { commitFillColorAtom } from './commitFillColor'
import { clearFillColorPreviewAtom, previewFillColorAtom } from './previewFillColor'

const labels = {
  swatchLabel: 'Fill color',
  hexLabel: 'Fill color hex',
  pickerTitle: 'Fill color',
} as const

export function FillColorControl() {
  return (
    <ColorControl
      paintAtom={selectionFillAtom}
      previewAtom={previewFillColorAtom}
      clearPreviewAtom={clearFillColorPreviewAtom}
      commitAtom={commitFillColorAtom}
      slotsAtom={colorSlotsAtom}
      labels={labels}
      triggerDataSlot="fill-color-trigger"
    />
  )
}
