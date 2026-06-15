import { colorSlotsAtom } from '@/store/atoms/colorSlots'
import { selectionStrokeAtom } from '@/store/atoms/selection-stroke'

import { ColorControl } from './ColorControl'
import { commitStrokeColorAtom } from './commitStrokeColor'
import { clearStrokeColorPreviewAtom, previewStrokeColorAtom } from './previewStrokeColor'

const labels = {
  swatchLabel: 'Stroke color',
  hexLabel: 'Stroke color hex',
  pickerTitle: 'Stroke color',
} as const

export function StrokeColorControl() {
  return (
    <ColorControl
      paintAtom={selectionStrokeAtom}
      previewAtom={previewStrokeColorAtom}
      clearPreviewAtom={clearStrokeColorPreviewAtom}
      commitAtom={commitStrokeColorAtom}
      slotsAtom={colorSlotsAtom}
      labels={labels}
      triggerDataSlot="stroke-color-trigger"
    />
  )
}
