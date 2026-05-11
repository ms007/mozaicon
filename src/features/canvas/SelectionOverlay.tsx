import { useAtomValue } from 'jotai'

import { selectionBboxAtom } from '@/store/atoms/selection'

export function SelectionOverlay() {
  const bbox = useAtomValue(selectionBboxAtom)

  if (!bbox) return null

  return (
    <rect
      x={bbox.x}
      y={bbox.y}
      width={bbox.width}
      height={bbox.height}
      className="stroke-primary"
      fill="none"
      strokeWidth={2}
      vectorEffect="non-scaling-stroke"
      pointerEvents="none"
    />
  )
}
