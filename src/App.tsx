import { useStore } from 'jotai'
import { useMemo } from 'react'

import { TooltipProvider } from '@/components/primitives/Tooltip'
import { Artboard } from '@/features/canvas/Artboard'
import { createCanvasBindings } from '@/features/canvas/bindings'
import { createHistoryBindings } from '@/features/history/bindings'
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
      <div className="bg-muted relative flex min-h-svh">
        <Toolbar />
        <main className="flex flex-1 items-center justify-center p-8 pl-16">
          <Artboard />
        </main>
      </div>
    </TooltipProvider>
  )
}
