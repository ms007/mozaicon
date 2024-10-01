import { useWindowSize } from 'react-use'
import { useAtomValue } from 'jotai'

import { Artboard } from './artboard'
import { sidebarWidthAtom, inspectorWidthAtom } from '@/atoms/layoutAtoms'

import { box } from './Canvas.module.css'

const Canvas = () => {
  const { width, height } = useWindowSize()
  const sidebarWidth = useAtomValue(sidebarWidthAtom)
  const inspectorWidth = useAtomValue(inspectorWidthAtom)

  const maxWidth = width - sidebarWidth - inspectorWidth - 160
  const maxHeight = height - 160
  const artboardWidth = maxWidth < maxHeight ? maxWidth : maxHeight
  const minSize = 300

  return (
    <div className={box}>
      <Artboard width={artboardWidth >= minSize ? artboardWidth : minSize} />
    </div>
  )
}

export default Canvas
