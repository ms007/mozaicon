import { useState } from 'react'
import { useAtomValue } from 'jotai'

import { Artboard } from './artboard'
import { CanvasItem } from './CanvasItem'
import { NewCanvasItem } from './NewCanvasItem'
import { Selection, Hover } from './selection'

import { canvasItemsAtom } from '@/atoms/canvas'

import { box } from './Canvas.module.css'

const Canvas = () => {
  const [cursor, setCursor] = useState(null)
  const canvasItems = useAtomValue(canvasItemsAtom)

  return (
    <div className={box}>
      <Artboard cursor={cursor}>
        {canvasItems.map((item) => {
          return <CanvasItem key={item} id={item} />
        })}

        <NewCanvasItem toggleCursor={setCursor} />
        <Hover />
        <Selection />
      </Artboard>
    </div>
  )
}

export default Canvas
