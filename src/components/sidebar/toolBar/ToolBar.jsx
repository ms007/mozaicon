import { v4 as uuid } from 'uuid'
import { useSetAtom } from 'jotai'

import { H4 } from '@/components/common'

import { ToolButton } from './toolButton'
import { ToolCaption } from './toolCaption'
import { ToolTitle } from './toolTitle'
import { Rectangle } from './shapes'

import { canvasItemsAtom, canvasItemsAtomFamily } from '@/atoms/canvas'

import styles from './ToolBar.module.css'

export default function ToolBar() {
  const setItems = useSetAtom(canvasItemsAtom)

  const addNewCanvasItem = (type) => {
    const id = uuid()
    setItems((prev) => [...prev, id])
    canvasItemsAtomFamily({ id, type })
  }

  return (
    <section className={styles.box}>
      <H4>Tools</H4>
      <ToolButton onClick={() => addNewCanvasItem('rectangle')}>
        <Rectangle />
        <ToolTitle>Rectangle</ToolTitle>
        <ToolCaption>(R)</ToolCaption>
      </ToolButton>
    </section>
  )
}
