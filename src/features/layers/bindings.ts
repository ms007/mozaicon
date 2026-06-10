import type { createStore } from 'jotai'

import { ALT_KEY_LABEL, MOD_KEY_LABEL } from '@/features/shortcuts/match'
import type { ShortcutBinding } from '@/features/shortcuts/registry'
import { activeIconAtom } from '@/store/atoms/project'
import { selectedIdsAtom } from '@/store/atoms/selection'
import { moveShapeBlockCommand, reorderStepCommand } from '@/store/commands/reorderShapes'

export function createLayerBindings(store: ReturnType<typeof createStore>): ShortcutBinding[] {
  return [
    {
      id: 'layers.bringForward',
      key: ']',
      modifiers: ['mod'],
      label: 'Bring forward',
      hint: `${MOD_KEY_LABEL}+]`,
      run: () => {
        const ids = store.get(selectedIdsAtom)
        if (ids.length === 0) return
        store.set(reorderStepCommand, { ids, direction: 'forward' })
      },
    },
    {
      id: 'layers.sendBackward',
      key: '[',
      modifiers: ['mod'],
      label: 'Send backward',
      hint: `${MOD_KEY_LABEL}+[`,
      run: () => {
        const ids = store.get(selectedIdsAtom)
        if (ids.length === 0) return
        store.set(reorderStepCommand, { ids, direction: 'backward' })
      },
    },
    {
      id: 'layers.bringToFront',
      key: ']',
      code: 'BracketRight',
      modifiers: ['mod', 'alt'],
      label: 'Bring to front',
      hint: `${MOD_KEY_LABEL}+${ALT_KEY_LABEL}+]`,
      run: () => {
        const ids = store.get(selectedIdsAtom)
        if (ids.length === 0) return
        store.set(moveShapeBlockCommand, { ids, beforeId: null })
      },
    },
    {
      id: 'layers.sendToBack',
      key: '[',
      code: 'BracketLeft',
      modifiers: ['mod', 'alt'],
      label: 'Send to back',
      hint: `${MOD_KEY_LABEL}+${ALT_KEY_LABEL}+[`,
      run: () => {
        const ids = store.get(selectedIdsAtom)
        if (ids.length === 0) return
        const idSet = new Set(ids)
        const shapes = store.get(activeIconAtom).shapes
        const movingSet = new Set(
          shapes.filter((s) => idSet.has(s.id) && !s.locked).map((s) => s.id),
        )
        const firstNonMoving = shapes.find((s) => !movingSet.has(s.id))
        store.set(moveShapeBlockCommand, {
          ids,
          beforeId: firstNonMoving?.id ?? null,
        })
      },
    },
  ]
}
