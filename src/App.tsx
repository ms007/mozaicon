import { useStore } from 'jotai'
import { useMemo } from 'react'

import { TooltipProvider } from '@/components/primitives/Tooltip'
import { Artboard } from '@/features/canvas/Artboard'
import { createCanvasBindings } from '@/features/canvas/bindings'
import { createHistoryBindings } from '@/features/history/bindings'
import { LayersPanel } from '@/features/layers/LayersPanel'
import { PropertiesPanel } from '@/features/properties/PropertiesPanel'
import { buildBindings } from '@/features/shortcuts/registry'
import { useGlobalShortcuts } from '@/features/shortcuts/useGlobalShortcuts'
import { createToolbarBindings } from '@/features/toolbar/bindings'
import { Toolbar } from '@/features/toolbar/Toolbar'

export default function App() {
  const store = useStore()
  const bindings = useMemo(
    () =>
      buildBindings([
        ...createCanvasBindings(store),
        ...createToolbarBindings(store),
        ...createHistoryBindings(store),
      ]),
    [store],
  )
  useGlobalShortcuts(bindings)

  return (
    <TooltipProvider>
      <div className="bg-muted flex min-h-svh">
        <LayersPanel />
        <main className="relative flex flex-1 items-center justify-center p-8 pl-16">
          <Toolbar />
          <Artboard />
        </main>
        <PropertiesPanel />
      </div>
    </TooltipProvider>
  )
}
