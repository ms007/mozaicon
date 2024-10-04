import { useAtomValue } from 'jotai'

import { Artboard } from './artboard'
import { CanvasItem } from './CanvasItem'

import { canvasItemsAtom } from '@/atoms/canvas'

import { box } from './Canvas.module.css'

const Canvas = () => {
  const canvasItems = useAtomValue(canvasItemsAtom)

  return (
    <div className={box}>
      <Artboard>
        {canvasItems.map((item) => {
          return <CanvasItem key={item} id={item} />
        })}
      </Artboard>
    </div>
  )
}

export default Canvas
