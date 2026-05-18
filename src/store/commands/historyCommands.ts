import { atom } from 'jotai'

import { documentAtom } from '@/store/atoms/document'
import { isGestureActiveAtom } from '@/store/atoms/gesture'
import { redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import { restoreSelectionAtom } from '@/store/atoms/selection'

export const undoCommand = atom(null, (get, set) => {
  if (get(isGestureActiveAtom)) return
  const stack = get(undoStackAtom)
  if (stack.length === 0) return
  const entry = stack[stack.length - 1]
  set(documentAtom, entry.before)
  set(restoreSelectionAtom, entry.selectionBefore)
  set(undoStackAtom, stack.slice(0, -1))
  set(redoStackAtom, (redo) => [...redo, entry])
})

export const redoCommand = atom(null, (get, set) => {
  if (get(isGestureActiveAtom)) return
  const stack = get(redoStackAtom)
  if (stack.length === 0) return
  const entry = stack[stack.length - 1]
  set(documentAtom, entry.after)
  set(restoreSelectionAtom, entry.selectionAfter)
  set(redoStackAtom, stack.slice(0, -1))
  set(undoStackAtom, (undo) => [...undo, entry])
})
