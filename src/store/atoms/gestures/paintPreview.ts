import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

import type { GestureAdapter } from './registry'

export type PaintOverride = {
  fill?: string
  stroke?: string
  strokeWidth?: number
}

export const paintPreviewDraftAtom = atom<Record<string, PaintOverride> | null>(null)

function overrideEqual(a: PaintOverride | null, b: PaintOverride | null): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  return a.fill === b.fill && a.stroke === b.stroke && a.strokeWidth === b.strokeWidth
}

export const paintPreviewDraftForShapeAtom = atomFamily((id: string) =>
  selectAtom(paintPreviewDraftAtom, (draft) => draft?.[id] ?? null, overrideEqual),
)

export const paintPreviewAdapter: GestureAdapter<Record<string, PaintOverride>> = {
  name: 'paintPreview',
  draftAtom: paintPreviewDraftAtom,
  blocksCommands: false,
}
