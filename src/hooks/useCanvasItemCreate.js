import { useState, useCallback, useEffect } from 'react'

import { useSvgContainer } from './useSvgContainer'
import { useSvgMousePosition } from './useSvgMousePosition'

export function useCanvasItemCreate(isCreating, func) {
  const svg = useSvgContainer()
  const [isMoving, setIsMoving] = useState(false)

  const getMousePosition = useSvgMousePosition()

  const callback = useCallback(
    (status, position) => {
      func({ status, position })
    },
    [func]
  )

  const handleMouseDown = useCallback(
    (event) => {
      setIsMoving(true)

      const position = getMousePosition(event)
      callback('start', position)
    },
    [callback, getMousePosition]
  )

  const handleMouseMove = useCallback(
    (event) => {
      if (!isMoving) {
        return
      }

      const position = getMousePosition(event)
      callback('moving', position)
    },
    [callback, getMousePosition, isMoving]
  )

  const handleMouseUp = useCallback(
    (event) => {
      if (!isMoving) {
        return
      }

      setIsMoving(false)

      const position = getMousePosition(event)
      callback('end', position)
    },
    [callback, getMousePosition, isMoving]
  )

  useEffect(() => {
    if (!isCreating) return
    svg.addEventListener('mousedown', handleMouseDown)

    return () => svg.removeEventListener('mousedown', handleMouseDown)
  }, [svg, handleMouseDown, isCreating])

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

  return
}
