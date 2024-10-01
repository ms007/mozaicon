import { Sidebar } from '@/components/sidebar'
import { Inspector } from '@/components/inspector'
import { Canvas } from '@/components/canvas'

import { useLayout } from '@/hooks/useLayout'
import { useTheme } from '@/hooks/useTheme'

import { container } from './App.module.css'

export function App() {
  useLayout()
  useTheme()

  return (
    <div className={container}>
      <Sidebar />
      <Canvas />
      <Inspector />
    </div>
  )
}
