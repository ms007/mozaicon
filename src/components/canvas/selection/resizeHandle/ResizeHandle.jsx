import { useAtomValue } from 'jotai'

import { Handle } from './Handle'

import { useCanvasItemResize } from '@/hooks/useCanvasItemResize'
import { artboardPixelSize } from '@/atoms/artboard'

const ResizeHandle = ({ direction, onResizeStart, onResize, onResizeEnd, ...props }) => {
  const sizeOfOnePixel = useAtomValue(artboardPixelSize)
  const size = sizeOfOnePixel * 4
  const strokeWidth = sizeOfOnePixel * 2

  const { onMouseDown } = useCanvasItemResize(({ status, event, position }) => {
    event.stopPropagation()

    if (status === 'start') {
      onResizeStart(direction, position)
    }

    if (status === 'moving') {
      onResize(direction, position)
    }

    if (status === 'end') {
      onResizeEnd(direction, position)
    }
  })

  return (
    <Handle
      size={size}
      direction={direction}
      onMouseDown={onMouseDown}
      strokeWidth={strokeWidth}
      {...props}
    />
  )
}

export default ResizeHandle
