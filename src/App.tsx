import { TooltipProvider } from '@/components/primitives/Tooltip'
import { CanvasStage } from '@/features/canvas/CanvasStage'
import { Toolbar } from '@/features/toolbar/Toolbar'

export default function App() {
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
