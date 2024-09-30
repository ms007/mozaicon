import { useAtom } from 'jotai'

import { sidebarWidthAtom, inspectorWidthAtom } from '@/atoms/layoutAtoms'

export const useLayout = () => {
  const [sidebarWidth] = useAtom(sidebarWidthAtom)
  const [inspectorWidth] = useAtom(inspectorWidthAtom)

  return {
    'sidebar-width': `${sidebarWidth}px`,
    'inspector-width': `${inspectorWidth}px`,
  }
}
