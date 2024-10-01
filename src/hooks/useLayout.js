import { useEffect } from 'react'
import { useAtom } from 'jotai'

import { useGlobalVariables } from './useGlobalVariables'
import { sidebarWidthAtom, inspectorWidthAtom } from '@/atoms/layoutAtoms'

export const useLayout = () => {
  const [, setVariables] = useGlobalVariables()
  const [sidebarWidth] = useAtom(sidebarWidthAtom)
  const [inspectorWidth] = useAtom(inspectorWidthAtom)

  useEffect(() => {
    if (sidebarWidth && inspectorWidth) {
      setVariables({
        'sidebar-width': `${sidebarWidth}px`,
        'inspector-width': `${inspectorWidth}px`,
      })
    }
  }, [sidebarWidth, inspectorWidth, setVariables])
}
