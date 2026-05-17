import type { createStore } from 'jotai'

import type { ShortcutBinding } from '@/features/shortcuts/registry'
import { cancelDraftAtom } from '@/store/atoms/draft'
import { isGestureActiveAtom } from '@/store/atoms/gesture'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { activeToolAtom } from '@/store/atoms/tool'
import { clearSelectionCommand } from '@/store/commands/selectionCommands'

export function createCanvasBindings(store: ReturnType<typeof createStore>): ShortcutBinding[] {
  return [
    {
      id: 'canvas.escape',
      key: 'Escape',
      label: 'Cancel / deselect',
      hint: 'Esc',
      run: () => {
        if (store.get(isGestureActiveAtom)) {
          store.set(cancelDraftAtom)
          return
        }
        if (store.get(activeToolAtom) !== null) {
          store.set(activeToolAtom, null)
          return
        }
        if (store.get(selectedIdsAtom).length > 0) {
          store.set(clearSelectionCommand, undefined)
        }
      },
    },
  ]
}
