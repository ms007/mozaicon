import { useAtomValue } from 'jotai'

import { Handle } from './Handle'

import { useCanvasItemResize } from '@/hooks/useCanvasItemResize'
import { artboardPixelSize } from '@/atoms/artboard'

const ResizeHandle = ({ direction, onResizeStart, onResize, onResizeEnd, ...props }) => {
  const sizeOfOnePixel = useAtomValue(artboardPixelSize)
  const size = sizeOfOnePixel * 4
  const strokeWidth = sizeOfOnePixel * 2

  const { onMouseDown } = useCanvasItemResize(({ status, position }) => {
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

  const onClick = (event) => {
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
  }

  return (
    <Handle
      size={size}
      direction={direction}
      onMouseDown={onMouseDown}
      strokeWidth={strokeWidth}
      onClick={onClick}
      {...props}
    />
  )
}

export default ResizeHandle
