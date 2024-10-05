import { useSetAtom } from 'jotai'

import { H4 } from '@/components/common'

import { ToolButton } from './toolButton'
import { ToolCaption } from './toolCaption'
import { ToolTitle } from './toolTitle'
import { Rectangle } from './shapes'

import { canvasWithNewCanvasItemAtom } from '@/atoms/canvas'

import styles from './ToolBar.module.css'

export default function ToolBar() {
  const startCreateCanvasItem = useSetAtom(canvasWithNewCanvasItemAtom)

  const onToolBarButtonClick = (type) => {
    startCreateCanvasItem(type)
  }

  return (
    <section className={styles.box}>
      <H4>Tools</H4>
      <ToolButton onClick={() => onToolBarButtonClick('rectangle')}>
        <Rectangle />
        <ToolTitle>Rectangle</ToolTitle>
        <ToolCaption>(R)</ToolCaption>
      </ToolButton>
    </section>
  )
}
