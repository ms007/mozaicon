import { useState, useCallback, useEffect } from 'react'
import { useSvgMousePosition } from './useSvgMousePosition'

const getTopLeftPosition = (position, offset) => {
  return {
    x: position.x - offset.x,
    y: position.y - offset.y,
  }
}

export function useCanvasItemMove(func) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isMoving, setIsMoving] = useState(false)

  const getMousePosition = useSvgMousePosition()

  const callback = useCallback(
    (status, position, event) => {
      func({ status, event, position })
    },
    [func]
  )

  const handleMouseDown = useCallback(
    (event, props) => {
      const mousePosition = getMousePosition(event)
      const selectedElement = event.target

      const { x, y } = selectedElement.getBBox()
      const offset = {
        x: (mousePosition.x -= parseFloat(x)),
        y: (mousePosition.y -= parseFloat(y)),
      }

      setIsMoving(true)
      setOffset(offset)
      const position = { x, y }
      callback('start', position, event, props)
    },
    [callback, getMousePosition]
  )

  const handleMouseMove = useCallback(
    (event) => {
      if (!isMoving) {
        return
      }

      const mousePosition = getMousePosition(event)
      const position = getTopLeftPosition(mousePosition, offset)
      callback('moving', position, event)
    },
    [callback, getMousePosition, isMoving, offset]
  )

  const handleMouseUp = useCallback(
    (event) => {
      if (!isMoving) {
        return
      }

      setIsMoving(false)

      const mousePosition = getMousePosition(event)
      const position = getTopLeftPosition(mousePosition, offset)
      callback('end', position, event)
    },
    [callback, getMousePosition, isMoving, offset]
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
