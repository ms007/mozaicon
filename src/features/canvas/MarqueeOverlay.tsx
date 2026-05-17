import { useAtomValue } from 'jotai'

import { marqueeRectAtom } from '@/store/atoms/marquee-draft'

export function MarqueeOverlay() {
  const rect = useAtomValue(marqueeRectAtom)

  if (!rect) return null

  return (
    <rect
      data-testid="marquee-overlay"
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      className="stroke-primary fill-primary/20"
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
      pointerEvents="none"
    />
  )
}
