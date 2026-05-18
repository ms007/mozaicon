import { atom } from 'jotai'

import { documentAtom } from '@/store/atoms/document'
import { isGestureActiveAtom } from '@/store/atoms/gesture'
import { redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import { commitSelectionAtom, selectedIdsAtom } from '@/store/atoms/selection'
import type { Document } from '@/types/shapes'

export type CommandResult = {
  document?: Document
  selection?: string[]
}

export function createCommand<Payload>(
  label: string,
  apply: (doc: Document, payload: Payload, selection: string[]) => CommandResult,
) {
  return atom(null, (get, set, payload: Payload) => {
    if (get(isGestureActiveAtom)) return

    const before = get(documentAtom)
    const selectionBefore = get(selectedIdsAtom)
    const result = apply(before, payload, selectionBefore)

    const after = result.document ?? before
    const { changed: selChanged, ids: selectionAfter } = result.selection
      ? set(commitSelectionAtom, { ids: result.selection, doc: after })
      : { changed: false, ids: selectionBefore }

    const docChanged = after !== before
    if (!docChanged && !selChanged) return

    if (docChanged) set(documentAtom, after)
    set(undoStackAtom, (s) => [...s, { label, before, after, selectionBefore, selectionAfter }])
    set(redoStackAtom, [])
  })
}
