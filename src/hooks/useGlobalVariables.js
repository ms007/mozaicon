import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomEffect } from 'jotai-effect'

const globalVariablesAtom = atom({})

const appendGlobalVariablesAtom = atom(null, (get, set, variables) => {
  const currentVariables = get(globalVariablesAtom)
  const allVariables = { ...currentVariables, ...variables }
  set(globalVariablesAtom, allVariables)
})

const updateGlobalVariablesAtom = atomEffect((get) => {
  const variables = get(globalVariablesAtom)
  const sheet = new CSSStyleSheet()

  let cssVariables = ':root {'
  Object.keys(variables).forEach((key) => {
    cssVariables += `--${key}: ${variables[key]};`
  })
  cssVariables += '}'

  sheet.replaceSync(cssVariables)
  document.adoptedStyleSheets = [sheet]
})

updateGlobalVariablesAtom.debugLabel = 'updateGlobalVariablesAtom'

export const useGlobalVariables = () => {
  const globalVariables = useAtomValue(globalVariablesAtom)
  const setGlobalVariables = useSetAtom(appendGlobalVariablesAtom)
  useAtom(updateGlobalVariablesAtom)

  return [globalVariables, setGlobalVariables]
}
