import { atom } from 'jotai'

import { documentAtom } from '@/store/atoms/document'
import { isGestureActiveAtom } from '@/store/atoms/draft'
import { redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import { normalizeSelection, selectedIdsAtom } from '@/store/atoms/selection'
import type { Document } from '@/types/shapes'

export type CommandResult = {
  document?: Document
  selection?: string[]
}

function arrayShallowEqual(a: string[], b: string[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
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
    const selectionAfter = result.selection
      ? normalizeSelection(result.selection, after)
      : selectionBefore

    const docChanged = after !== before
    const selChanged = !arrayShallowEqual(selectionAfter, selectionBefore)
    if (!docChanged && !selChanged) return

    if (docChanged) set(documentAtom, after)
    if (selChanged) set(selectedIdsAtom, selectionAfter)
    set(undoStackAtom, (s) => [...s, { label, before, after, selectionBefore, selectionAfter }])
    set(redoStackAtom, [])
  })
}
