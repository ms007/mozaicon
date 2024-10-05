import { useCallback } from 'react'
import { useSvgContainer } from './useSvgContainer'

export function useSvgMousePosition() {
  const svg = useSvgContainer()

  const getMousePosition = useCallback(
    (event) => {
      const CTM = svg.getScreenCTM()
      return {
        x: (event.clientX - CTM.e) / CTM.a,
        y: (event.clientY - CTM.f) / CTM.d,
      }
    },
    [svg]
  )

  return useCallback(getMousePosition, [getMousePosition])
}
