import { atom } from 'jotai'

export const globalVariablesAtom = atom({})

export const appendGlobalVariablesAtom = atom(null, (get, set, variables) => {
  const currentVariables = get(globalVariablesAtom)
  const allVariables = { ...currentVariables, ...variables }
  set(globalVariablesAtom, allVariables)
})
