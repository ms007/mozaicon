import { atom } from 'jotai'

import type { Document } from '@/types/shapes'

import { isGestureActiveAtom } from './draft'

export type HistoryEntry = {
  label: string
  before: Document
  after: Document
  selectionBefore: string[]
  selectionAfter: string[]
}

export const undoStackAtom = atom<HistoryEntry[]>([])
export const redoStackAtom = atom<HistoryEntry[]>([])

export const canUndoAtom = atom((get) => get(undoStackAtom).length > 0 && !get(isGestureActiveAtom))
export const canRedoAtom = atom((get) => get(redoStackAtom).length > 0 && !get(isGestureActiveAtom))
