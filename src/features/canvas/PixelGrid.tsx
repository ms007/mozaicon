import { useAtomValue } from 'jotai'
import { useId } from 'react'

import { viewBoxAtom } from '@/store/atoms/canvas'

const TESTID = 'pixel-grid'

export function PixelGrid() {
  const [minX, minY, width, height] = useAtomValue(viewBoxAtom)
  const patternId = useId()

  return (
    <g className="text-foreground/25" pointerEvents="none">
      <defs>
        <pattern
          id={patternId}
          x={-0.5}
          y={-0.5}
          width={1}
          height={1}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={0.5} cy={0.5} r={0.09} fill="currentColor" />
        </pattern>
      </defs>
      <rect
        data-testid={TESTID}
        x={minX - 0.25}
        y={minY - 0.25}
        width={width + 0.5}
        height={height + 0.5}
        fill={`url(#${patternId})`}
      />
    </g>
  )
}
