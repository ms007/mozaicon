import type { createStore } from 'jotai'

import { MOD_KEY_LABEL } from '@/features/shortcuts/match'
import type { ShortcutBinding } from '@/features/shortcuts/registry'
import { allExportDisabledAtom, exportTargetAtom } from '@/store/atoms/export'
import { activeIconAtom } from '@/store/atoms/project'

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
        void performExport(store.get(activeIconAtom), store.get(exportTargetAtom))
      },
    },
  ]
}
