import { H4 } from '@/components/common'

import { ToolButton } from './toolButton'
import { ToolCaption } from './toolCaption'
import { ToolTitle } from './toolTitle'
import { Rectangle } from './shapes'

import styles from './ToolBar.module.css'

export default function ToolBar() {
  return (
    <section className={styles.box}>
      <H4>Tools</H4>
      <ToolButton>
        <Rectangle />
        <ToolTitle>Rectangle</ToolTitle>
        <ToolCaption>(R)</ToolCaption>
      </ToolButton>
    </section>
  )
}
