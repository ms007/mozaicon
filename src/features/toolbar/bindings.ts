import type { ShortcutBinding } from '@/features/shortcuts/registry'

import { createToolbarActions } from './actions'

type ToolbarActions = ReturnType<typeof createToolbarActions>
type ToolbarBindingDef = Omit<ShortcutBinding, 'run'> & {
  run: (actions: ToolbarActions) => void
}

const TOOLBAR_BINDING_DEFS: readonly ToolbarBindingDef[] = [
  {
    id: 'tool.rect.activate',
    key: 'R',
    label: 'Rectangle',
    hint: 'R',
    run: (actions) => {
      actions.handleChange('rect')
    },
  },
]

// Static metadata for tooltip hint lookups (no store needed).
export const TOOLBAR_SHORTCUT_META = TOOLBAR_BINDING_DEFS

export function createToolbarBindings(
  store: Parameters<typeof createToolbarActions>[0],
): ShortcutBinding[] {
  const actions = createToolbarActions(store)
  return TOOLBAR_BINDING_DEFS.map(({ run, ...meta }) => ({
    ...meta,
    run: () => {
      run(actions)
    },
  }))
}
