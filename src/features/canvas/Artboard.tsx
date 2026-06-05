import { useRef } from 'react'

import { CanvasStage } from '@/features/canvas/CanvasStage'
import { useNudgeKeyboard } from '@/features/canvas/useNudgeKeyboard'
import { useToolPointerBridge } from '@/features/canvas/useToolPointerBridge'
import { useToolLifecycle } from '@/features/toolbar/useToolLifecycle'
import { cn } from '@/lib/utils'

export function Artboard() {
  const svgRef = useRef<SVGSVGElement>(null)
  const tool = useToolLifecycle()
  const handlers = useToolPointerBridge(tool, svgRef)
  useNudgeKeyboard()

  return (
    <div className={cn('bg-card rounded-xl p-[calc(512px/24)]', tool?.cursorClass)} {...handlers}>
      <CanvasStage svgRef={svgRef} />
    </div>
  )
}
