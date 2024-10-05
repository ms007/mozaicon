import { useEffect, useRef } from 'react'

const getContainer = () => document.getElementById('svg-container')

export function useSvgContainer() {
  const svgContainer = useRef(getContainer())

  useEffect(() => {
    svgContainer.current = getContainer()
  }, [])

  return svgContainer.current || null
}
