import { Sidebar } from '@/components/sidebar'
import { Inspector } from '@/components/inspector'
import { Canvas } from '@/components/canvas'

import { useLayout } from '@/hooks/useLayout'
import { useCSSVariables } from '@/hooks/useCSSVariables'

import { container } from './App.module.css'

export function App() {
  const layout = useLayout()
  useCSSVariables(layout)

  return (
    <div className={container}>
      <Sidebar />
      <Canvas />
      <Inspector />
    </div>
  )
}
