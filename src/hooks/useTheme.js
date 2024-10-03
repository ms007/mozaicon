import { useEffect } from 'react'
import { useLocalStorage } from 'react-use'
import { atom, useAtom } from 'jotai'

import { light, dark } from '@/styles/colors'
import { useGlobalVariables } from '@/hooks/useGlobalVariables'

const presetsThemeAtom = atom(null)

const colors = {
  light,
  dark,
}

const setClassName = (theme) => {
  document.body.classList.remove('light', 'dark')
  document.body.classList.add(theme)
}

const getInitialColorMode = () => {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const hasMediaQueryPreference = typeof mql.matches === 'boolean'
  if (hasMediaQueryPreference) {
    return mql.matches ? 'dark' : 'light'
  }

  return 'light'
}

export const useTheme = () => {
  const [name, setName] = useLocalStorage('theme', getInitialColorMode())
  const [theme, setTheme] = useAtom(presetsThemeAtom)
  const [, setGlobalVariables] = useGlobalVariables()

  useEffect(() => {
    const variables = colors[name]
    setGlobalVariables(variables)
    setTheme(name)
    setClassName(name)
  }, [name, setTheme, setGlobalVariables])

  const toggleTheme = () => {
    setName(name === 'dark' ? 'light' : 'dark')
  }

  const isReady = theme != null
  return { theme, toggleTheme, isReady }
}
