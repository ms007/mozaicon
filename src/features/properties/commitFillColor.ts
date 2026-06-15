import { atom } from 'jotai'

import { setFillColorCommand } from '@/store/commands/setFillColor'

// setFillColorCommand already no-ops on an empty selection, so no guard here.
export const commitFillColorAtom = atom(null, (_get, set, color: string) => {
  set(setFillColorCommand, color)
})
