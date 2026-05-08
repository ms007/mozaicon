import { useStore } from 'jotai'
import { useMemo } from 'react'

import { TooltipProvider } from '@/components/primitives/Tooltip'
import { CanvasStage } from '@/features/canvas/CanvasStage'
import { buildBindings } from '@/features/shortcuts/registry'
import { useGlobalShortcuts } from '@/features/shortcuts/useGlobalShortcuts'
import { createToolbarBindings } from '@/features/toolbar/bindings'
import { Toolbar } from '@/features/toolbar/Toolbar'

export default function App() {
  const store = useStore()
  const bindings = useMemo(() => buildBindings(createToolbarBindings(store)), [store])
  useGlobalShortcuts(bindings)

  return (
    <TooltipProvider>
      <div className="bg-muted relative flex min-h-svh">
        <Toolbar />
        <main className="flex flex-1 items-center justify-center p-8 pl-16">
          <CanvasStage />
        </main>
      </div>
    </TooltipProvider>
  )
}
