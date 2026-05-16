import type { ShortcutBinding } from '@/features/shortcuts/registry'

import { createToolbarActions } from './actions'
import { TOOL_REGISTRY } from './registry'

export function createToolbarBindings(
  store: Parameters<typeof createToolbarActions>[0],
): ShortcutBinding[] {
  const actions = createToolbarActions(store)
  return TOOL_REGISTRY.map((t) => ({
    id: `tool.${t.id}.activate`,
    key: t.hotkey,
    label: t.label,
    hint: t.hotkey,
    run: () => {
      actions.handleChange(t.id)
    },
  }))
}
