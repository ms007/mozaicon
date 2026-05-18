import type { createStore } from 'jotai'

import { redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import { selectShapesCommand } from '@/store/commands/selectionCommands'

export function seedSelection(store: ReturnType<typeof createStore>, ids: string[]): void {
  store.set(selectShapesCommand, ids)
  store.set(undoStackAtom, [])
  store.set(redoStackAtom, [])
}
