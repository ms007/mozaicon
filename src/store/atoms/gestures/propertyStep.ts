import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

import { type Rect, rectEqual, unionRects } from '@/lib/geometry/rect'

import type { DisplayContribution, GestureAdapter } from './registry'

export const propertyStepDraftAtom = atom<Record<string, Rect> | null>(null)

export const propertyStepDraftForShapeAtom = atomFamily((id: string) =>
  selectAtom(propertyStepDraftAtom, (draft) => draft?.[id] ?? null, rectEqual),
)

function propertyStepDisplayBbox(draft: Record<string, Rect>): DisplayContribution {
  const union = unionRects(Object.values(draft))
  if (!union) return { kind: 'passThrough' }
  return { kind: 'rect', value: union }
}

export const propertyStepAdapter: GestureAdapter<Record<string, Rect>> = {
  name: 'propertyStep',
  draftAtom: propertyStepDraftAtom,
  displayBbox: propertyStepDisplayBbox,
  blocksCommands: false,
}
