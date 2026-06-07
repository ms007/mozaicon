import { atom } from 'jotai'

import { documentAtom } from './document'

export type ExportTarget = 'svg' | 'tsx' | 'png1x' | 'png2x' | 'png4x'

export const exportTargetAtom = atom<ExportTarget>('svg')

export const allExportDisabledAtom = atom((get) => {
  const doc = get(documentAtom)
  return !doc.shapes.some((s) => s.visible)
})
