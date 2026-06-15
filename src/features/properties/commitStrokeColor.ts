import { atom } from 'jotai'

import { setStrokeColorCommand } from '@/store/commands/setStrokeColor'

// setStrokeColorCommand already no-ops on an empty selection, so no guard here.
export const commitStrokeColorAtom = atom(null, (_get, set, color: string) => {
  set(setStrokeColorCommand, color)
})
