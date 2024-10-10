import { useState, useCallback, useEffect } from 'react'
import { useSvgMousePosition } from './useSvgMousePosition'

export function useCanvasItemResize(func) {
  const [isMoving, setIsMoving] = useState(false)

  const getMousePosition = useSvgMousePosition()

  const callback = useCallback(
    (status, position, event) => {
      func({ status, event, position })
    },
    [func]
  )

  const stopPropagation = (event) => {
    event.stopPropagation()
    event.nativeEvent
      ? event.nativeEvent.stopImmediatePropagation()
      : event.stopImmediatePropagation()
  }

  const handleMouseDown = useCallback(
    (event, props) => {
      stopPropagation(event)
      const position = getMousePosition(event)
      setIsMoving(true)
      callback('start', position, event, props)
    },
    [callback, getMousePosition]
  )

  const handleMouseMove = useCallback(
    (event) => {
      stopPropagation(event)
      if (!isMoving) {
        return
      }

      const position = getMousePosition(event)
      callback('moving', position, event)
    },
    [callback, getMousePosition, isMoving]
  )

  const handleMouseUp = useCallback(
    (event) => {
      stopPropagation(event)
      if (!isMoving) {
        return
      }

      setIsMoving(false)
      const position = getMousePosition(event)
      callback('end', position, event)
    },
    [callback, getMousePosition, isMoving]
  )

  useEffect(() => {
    function addEventListeners() {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    function removeEventListeners() {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    isMoving ? addEventListeners() : removeEventListeners()

    return removeEventListeners
  }, [handleMouseMove, handleMouseUp, isMoving])

  return {
    onMouseDown: handleMouseDown,
  }
}
