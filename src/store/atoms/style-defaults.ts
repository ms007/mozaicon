import { atom } from 'jotai'

export type StyleDefaults = {
  fill: string
  stroke: string
  strokeWidth: number
}

export const styleDefaultsAtom = atom<StyleDefaults>({
  fill: '#000',
  stroke: 'none',
  strokeWidth: 1,
})
