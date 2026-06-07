import type { createStore } from 'jotai'

import { MOD_KEY_LABEL } from '@/features/shortcuts/match'
import type { ShortcutBinding } from '@/features/shortcuts/registry'
import { documentAtom } from '@/store/atoms/document'
import { allExportDisabledAtom, exportTargetAtom } from '@/store/atoms/export'

import { performExport } from './performExport'

export function createExportBindings(store: ReturnType<typeof createStore>): ShortcutBinding[] {
  return [
    {
      id: 'export.trigger',
      key: 'e',
      modifiers: ['mod', 'shift'],
      label: 'Re-export',
      hint: `${MOD_KEY_LABEL}+Shift+E`,
      bypassEditable: true,
      run: () => {
        if (store.get(allExportDisabledAtom)) return
        void performExport(store.get(documentAtom), store.get(exportTargetAtom))
      },
    },
  ]
}
