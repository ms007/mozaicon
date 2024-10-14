import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DndProvider } from 'react-dnd'
import { TouchBackend } from 'react-dnd-touch-backend'
import { DevTools } from 'jotai-devtools'

import 'jotai-devtools/styles.css'

import { App } from './App.jsx'

import './styles/main.css'

const dndProviderOptions = {
  enableTouchEvents: false,
  enableMouseEvents: true,
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DevTools />
    <DndProvider backend={TouchBackend} options={dndProviderOptions}>
      <App />
    </DndProvider>
  </StrictMode>
)
