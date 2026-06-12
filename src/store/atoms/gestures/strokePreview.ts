import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

import type { GestureAdapter } from './registry'

export type StrokePaintOverride = {
  stroke?: string
  strokeWidth?: number
}

export const strokePreviewDraftAtom = atom<Record<string, StrokePaintOverride> | null>(null)

function overrideEqual(a: StrokePaintOverride | null, b: StrokePaintOverride | null): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  return a.stroke === b.stroke && a.strokeWidth === b.strokeWidth
}

export const strokePreviewDraftForShapeAtom = atomFamily((id: string) =>
  selectAtom(strokePreviewDraftAtom, (draft) => draft?.[id] ?? null, overrideEqual),
)

export const strokePreviewAdapter: GestureAdapter<Record<string, StrokePaintOverride>> = {
  name: 'strokePreview',
  draftAtom: strokePreviewDraftAtom,
  blocksCommands: false,
}
