import type { createStore } from 'jotai'

import type { ShortcutBinding } from '@/features/shortcuts/registry'
import { activeDragAtom, cancelDraftAtom } from '@/store/atoms/draft'
import { clearSelectionAtom } from '@/store/atoms/selection'
import { activeToolAtom } from '@/store/atoms/tool'

export function createCanvasBindings(store: ReturnType<typeof createStore>): ShortcutBinding[] {
  return [
    {
      id: 'canvas.escape',
      key: 'Escape',
      label: 'Cancel / deselect',
      hint: 'Esc',
      run: () => {
        const drag = store.get(activeDragAtom)
        if (drag) {
          store.set(cancelDraftAtom)
        }
        if (store.get(activeToolAtom) !== null) {
          store.set(activeToolAtom, null)
        }
        store.set(clearSelectionAtom)
      },
    },
  ]
}
