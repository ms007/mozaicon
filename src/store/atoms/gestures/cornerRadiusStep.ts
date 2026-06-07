import { atom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { atomFamily } from 'jotai-family'

import type { Radii } from '@/types/shapes'

import type { GestureAdapter } from './registry'

export const cornerRadiusStepDraftAtom = atom<Record<string, Radii> | null>(null)

function radiiEqual(a: Radii | null, b: Radii | null): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
}

export const cornerRadiusStepDraftForShapeAtom = atomFamily((id: string) =>
  selectAtom(cornerRadiusStepDraftAtom, (draft) => draft?.[id] ?? null, radiiEqual),
)

export const cornerRadiusStepAdapter: GestureAdapter<Record<string, Radii>> = {
  name: 'cornerRadiusStep',
  draftAtom: cornerRadiusStepDraftAtom,
  blocksCommands: false,
}
