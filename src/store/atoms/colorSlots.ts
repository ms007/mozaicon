import { atom } from 'jotai'

export const COLOR_SLOT_COUNT = 10

export type ColorSlot = string | null

export type ColorSlotsState = ColorSlot[]

const defaultSlots: ColorSlotsState = [
  '#000000',
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
]

export function createColorSlotsAtom(initial: ColorSlotsState = defaultSlots) {
  return atom<ColorSlotsState>(initial)
}

export const colorSlotsAtom = createColorSlotsAtom()
