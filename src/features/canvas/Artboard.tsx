import { useAtomValue } from 'jotai'
import { useRef } from 'react'

import { CanvasStage } from '@/features/canvas/CanvasStage'
import { useToolPointerBridge } from '@/features/canvas/useToolPointerBridge'
import { useToolLifecycle } from '@/features/toolbar/useToolLifecycle'
import { cn } from '@/lib/utils'
import { isMovingAtom } from '@/store/atoms/move-draft'

export function Artboard() {
  const svgRef = useRef<SVGSVGElement>(null)
  const tool = useToolLifecycle()
  const handlers = useToolPointerBridge(tool, svgRef)
  const isMoving = useAtomValue(isMovingAtom)

  return (
    <div
      className={cn(
        'bg-card rounded-xl p-[calc(512px/24)]',
        isMoving ? 'cursor-move' : tool?.cursorClass,
      )}
      {...handlers}
    >
      <CanvasStage svgRef={svgRef} />
    </div>
  )
}
