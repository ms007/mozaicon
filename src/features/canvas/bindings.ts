import type { createStore } from 'jotai'

import type { ShortcutBinding } from '@/features/shortcuts/registry'
import {
  anyGestureDraftActiveAtom,
  cancelGesturesAtom as cancelDraftAtom,
} from '@/store/atoms/gestures/registry'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { activeToolAtom } from '@/store/atoms/tool'
import { deleteShapesCommand } from '@/store/commands/deleteShapes'
import { clearSelectionCommand } from '@/store/commands/selectionCommands'

export function createCanvasBindings(store: ReturnType<typeof createStore>): ShortcutBinding[] {
  const deleteSelected = () => {
    const ids = store.get(selectedIdsAtom)
    if (ids.length === 0) return
    store.set(deleteShapesCommand, { ids })
  }

  return [
    {
      id: 'canvas.escape',
      key: 'Escape',
      label: 'Cancel / deselect',
      hint: 'Esc',
      run: () => {
        if (store.get(anyGestureDraftActiveAtom)) {
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
    {
      id: 'canvas.delete',
      key: 'Delete',
      label: 'Delete selected',
      hint: 'Del',
      run: deleteSelected,
    },
    {
      id: 'canvas.backspace',
      key: 'Backspace',
      label: 'Delete selected',
      hint: '⌫',
      run: deleteSelected,
    },
  ]
}
