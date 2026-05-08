import type { createStore } from 'jotai'

import type { ShortcutBinding } from '@/features/shortcuts/registry'
import { activeDragAtom, cancelDraftAtom } from '@/store/atoms/draft'

export function createCanvasBindings(store: ReturnType<typeof createStore>): ShortcutBinding[] {
  return [
    {
      id: 'canvas.cancelDraft',
      key: 'Escape',
      label: 'Cancel draw',
      hint: 'Esc',
      run: () => {
        const drag = store.get(activeDragAtom)
        if (drag) {
          store.set(cancelDraftAtom)
        }
      },
    },
  ]
}
