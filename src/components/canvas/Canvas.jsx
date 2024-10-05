import { useAtomValue } from 'jotai'

import { Artboard } from './artboard'
import { CanvasItem } from './CanvasItem'
import { NewCanvasItem } from './NewCanvasItem'

import { canvasIsCreatingNewItemAtom, canvasItemsAtom, canvasNewItemTypeAtom } from '@/atoms/canvas'

import { box } from './Canvas.module.css'

const Canvas = () => {
  const isCreatingNewItem = useAtomValue(canvasIsCreatingNewItemAtom)
  const type = useAtomValue(canvasNewItemTypeAtom)
  const canvasItems = useAtomValue(canvasItemsAtom)

  return (
    <div className={box}>
      <Artboard>
        {isCreatingNewItem && <NewCanvasItem type={type} />}

        {canvasItems.map((item) => {
          return <CanvasItem key={item} id={item} />
        })}
      </Artboard>
    </div>
  )
}

export default Canvas
