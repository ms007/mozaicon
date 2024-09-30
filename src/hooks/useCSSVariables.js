import { useEffect, useState } from 'react'

export const useCSSVariables = (defaultValues) => {
  const [variables, setVariables] = useState(defaultValues)

  useEffect(() => {
    const sheet = new CSSStyleSheet()

    const applyVariables = (variables) => {
      let cssVariables = ':root {'
      Object.keys(variables).forEach((key) => {
        cssVariables += `--${key}: ${variables[key]};`
      })
      cssVariables += '}'
      sheet.replaceSync(cssVariables)
    }

    applyVariables(variables)
    document.adoptedStyleSheets = [sheet]

    return () => {
      document.adoptedStyleSheets = []
    }
  }, [variables])

  const updateVariables = (variables) => {
    setVariables((prevVariables) => ({
      ...prevVariables,
      ...variables,
    }))
  }

  return [variables, updateVariables]
}
