import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { DevTools } from 'jotai-devtools'
import 'jotai-devtools/styles.css'

import { App } from './App.jsx'

import './styles/main.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DevTools />
    <App />
  </StrictMode>
)
