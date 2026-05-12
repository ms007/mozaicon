import { atom } from 'jotai'

import { documentAtom } from '@/store/atoms/document'
import { redoStackAtom, undoStackAtom } from '@/store/atoms/history'

// Meta-commands: they manipulate the history stacks themselves, so they don't
// go through `createCommand` (which would push a new entry and clear redo).
export const undoCommand = atom(null, (get, set) => {
  const stack = get(undoStackAtom)
  if (stack.length === 0) return
  const entry = stack[stack.length - 1]
  set(documentAtom, entry.before)
  set(undoStackAtom, stack.slice(0, -1))
  set(redoStackAtom, (redo) => [...redo, entry])
})

export const redoCommand = atom(null, (get, set) => {
  const stack = get(redoStackAtom)
  if (stack.length === 0) return
  const entry = stack[stack.length - 1]
  set(documentAtom, entry.after)
  set(redoStackAtom, stack.slice(0, -1))
  set(undoStackAtom, (undo) => [...undo, entry])
})
