import { atom } from 'jotai'

import { activeIconAtom } from './project'

export type ExportTarget = 'svg' | 'tsx' | 'png1x' | 'png2x' | 'png4x'

export const exportTargetAtom = atom<ExportTarget>('svg')

export const allExportDisabledAtom = atom((get) => {
  const doc = get(activeIconAtom)
  return !doc.shapes.some((s) => s.visible)
})
