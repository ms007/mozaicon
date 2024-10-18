import { Fragment, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useLatest } from 'react-use'

import { H4 } from '@/components/common'
import { ScrollBox } from './scrollBox'
import { Shape } from './shape'
import { DragLayer } from './dragLayer'
import { Divider } from './divider'

import { sidebarItemsAtom, sidebarUpdateSidebarOrderAtom } from '@/atoms/sidebar'

import styles from './Shapes.module.css'

export default function Shapes() {
  const [dropIndex, setDropIndex] = useState(-1)
  const sidebarItems = useAtomValue(sidebarItemsAtom)
  const updateSidebarItemsOrder = useSetAtom(sidebarUpdateSidebarOrderAtom)
  const latestDropIndex = useLatest(dropIndex)

  const onDrop = ({ id }) => {
    const index = latestDropIndex.current
    updateSidebarItemsOrder({ index, id })
    setDropIndex(-1)
  }

  const onDropIndexChange = (index) => {
    if (index !== dropIndex) {
      setDropIndex(index)
    }
  }

  if (!sidebarItems.length) {
    return null
  }

  return (
    <section className={styles.box}>
      <H4>Shapes</H4>

      <ScrollBox>
        {sidebarItems.map((id, index) => (
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
