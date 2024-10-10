import { useKey } from 'react-use'

import { H4 } from '@/components/common'

import { ToolButton } from './toolButton'
import { ToolCaption } from './toolCaption'
import { ToolTitle } from './toolTitle'
import { Rectangle } from './shapes'

import { publish } from '@/utils/event'

import styles from './ToolBar.module.css'

export default function ToolBar() {
  useKey('r', () => onToolBarButtonClick('rectangle'))
  useKey('R', () => onToolBarButtonClick('rectangle'))

  const onToolBarButtonClick = (type) => {
    publish('onCreateCanvasItem', { type })
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
