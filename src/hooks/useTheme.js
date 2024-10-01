import { useEffect } from 'react'
import { useLocalStorage } from 'react-use'
import { useAtom } from 'jotai'

import { light, dark } from '@/styles/colors'
import { presetsThemeAtom } from '@/atoms/presetsAtom'
import { useGlobalVariables } from '@/hooks/useGlobalVariables'

const colors = {
  light,
  dark,
}

export const useTheme = (initialTheme = 'light') => {
  const [name, setName] = useLocalStorage('theme', initialTheme)
  const [theme, setTheme] = useAtom(presetsThemeAtom)
  const [, setGlobalVariables] = useGlobalVariables()

  useEffect(() => {
    const variables = colors[name]
    setGlobalVariables(variables)
    setTheme(name)
  }, [name, setTheme, setGlobalVariables])

  const toggleTheme = () => {
    setName(name === 'dark' ? 'light' : 'dark')
  }

  const isReady = theme != null
  return { theme, toggleTheme, isReady }
}
