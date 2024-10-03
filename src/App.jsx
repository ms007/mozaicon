import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { useWindowSize } from 'react-use'

import { Sidebar } from '@/components/sidebar'
import { Inspector } from '@/components/inspector'
import { Canvas } from '@/components/canvas'

import { useLayout } from '@/hooks/useLayout'
import { useTheme } from '@/hooks/useTheme'
import { presetsDimensionsAtom } from './atoms/presets'

import { container } from './App.module.css'

export function App() {
  const { width, height } = useWindowSize()
  const setDimensions = useSetAtom(presetsDimensionsAtom)

  useLayout()
  const { isReady } = useTheme()

  useEffect(() => {
    setDimensions({ width, height })
  }, [width, height, setDimensions])

  if (!isReady) {
    return null
  }

  return (
    <div className={container}>
      <Sidebar />
      <Canvas />
      <Inspector />
    </div>
  )
}
