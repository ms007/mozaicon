import { atom } from 'jotai'

export type StyleDefaults = {
  fill: string
  stroke: string
  strokeWidth: number
}

export const styleDefaultsAtom = atom<StyleDefaults>({
  fill: '#cccccc',
  stroke: 'none',
  strokeWidth: 1,
})
