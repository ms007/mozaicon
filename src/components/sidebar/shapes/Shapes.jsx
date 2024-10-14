import { Fragment, useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { useLatest } from 'react-use'

import { H4 } from '@/components/common'
import { ScrollBox } from './scrollBox'
import { Shape } from './shape'
import { DragLayer } from './dragLayer'
import { Divider } from './divider'

import { canvasSelectedItemsAtom } from '@/atoms/canvas'
import { sidebarItemsAtom } from '@/atoms/sidebar'

import styles from './Shapes.module.css'

export default function Shapes() {
  const [dropIndex, setDropIndex] = useState(-1)
  const [canvasItems, setCanvasItems] = useAtom(sidebarItemsAtom)
  const setSelectedItems = useSetAtom(canvasSelectedItemsAtom)

  const latestDropIndex = useLatest(dropIndex)
  const latestCanvasItems = useLatest(canvasItems)

  const onDrop = ({ id }) => {
    const latestItems = latestCanvasItems.current
    const latestIndex = latestDropIndex.current

    if (latestIndex >= 0) {
      setCanvasItems([
        ...latestItems.slice(0, latestIndex).filter((item) => item !== id),
        id,
        ...latestItems.slice(latestIndex).filter((item) => item !== id),
      ])
      setSelectedItems([id])
    }

    setDropIndex(-1)
  }

  const onDropIndexChange = (index) => {
    if (index !== dropIndex) {
      setDropIndex(index)
    }
  }

  if (!canvasItems.length) {
    return null
  }

  return (
    <section className={styles.box}>
      <H4>Shapes</H4>

      <ScrollBox>
        {canvasItems.map((id, index) => (
          <Fragment key={id}>
            <Divider visible={dropIndex === index} />
            <Shape id={id} index={index} onDrop={onDrop} onDropIndexChange={onDropIndexChange} />
            <Divider visible={dropIndex === index + 1} />
          </Fragment>
        ))}
      </ScrollBox>

      <DragLayer />
    </section>
  )
}
