import { Sidebar } from './components/sidebar'
import { Inspector } from './components/inspector'
import { Canvas } from './components/canvas'

import { container } from './App.module.css'

export function App() {
  return (
    <div className={container}>
      <Sidebar />
      <Canvas />
      <Inspector />
    </div>
  )
}
