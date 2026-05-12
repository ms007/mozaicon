import type { createStore } from 'jotai'

import { MOD_KEY_LABEL } from '@/features/shortcuts/match'
import type { ShortcutBinding } from '@/features/shortcuts/registry'
import { redoCommand, undoCommand } from '@/store/commands/historyCommands'

export function createHistoryBindings(store: ReturnType<typeof createStore>): ShortcutBinding[] {
  return [
    {
      id: 'history.undo',
      key: 'z',
      modifiers: ['mod'],
      label: 'Undo',
      hint: `${MOD_KEY_LABEL}+Z`,
      run: () => {
        store.set(undoCommand)
      },
    },
    {
      id: 'history.redo',
      key: 'z',
      modifiers: ['mod', 'shift'],
      label: 'Redo',
      hint: `${MOD_KEY_LABEL}+Shift+Z`,
      run: () => {
        store.set(redoCommand)
      },
    },
  ]
}
