import { useEffect } from 'react'

import { isEditableTarget, matches } from './match'
import type { ShortcutBinding } from './registry'

// Must be called exactly once, at the top of the React tree.
export function useGlobalShortcuts(bindings: ShortcutBinding[]): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat) return
      const inEditable = isEditableTarget(event.target)

      for (const binding of bindings) {
        if (matches(event, binding)) {
          if (inEditable && !binding.bypassEditable) continue
          event.preventDefault()
          binding.run()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [bindings])
}
