import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

import { type Rect, rectEqual, unionRects } from '@/lib/geometry/rect'

import type { DisplayContribution, GestureAdapter } from './registry'

export const resizeDraftAtom = atom<Record<string, Rect> | null>(null)

export const resizeDraftForShapeAtom = atomFamily((id: string) =>
  selectAtom(resizeDraftAtom, (draft) => draft?.[id] ?? null, rectEqual),
)

function resizeDisplayBbox(draft: Record<string, Rect>): DisplayContribution {
  const union = unionRects(Object.values(draft))
  if (!union) return { kind: 'passThrough' }
  return { kind: 'rect', value: union }
}

export const resizeAdapter: GestureAdapter<Record<string, Rect>> = {
  name: 'resize',
  draftAtom: resizeDraftAtom,
  displayBbox: resizeDisplayBbox,
}
