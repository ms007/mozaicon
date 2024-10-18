import { useAtomValue } from 'jotai'
import { useDragLayer } from 'react-dnd'
import cx from 'clsx'

import { Text } from '../shape/text'
import { Preview } from '../shape/preview'

import { canvasSelectedItemsAtom } from '@/atoms/canvas'

import styles from './DragLayer.module.css'

export default function DragLayer() {
  const selectedItems = useAtomValue(canvasSelectedItemsAtom)
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getSourceClientOffset(),
  }))

  if (!isDragging) {
    return null
  }

  const { id } = item
  const count = selectedItems.length
  const multipleItems = count > 1 && selectedItems.includes(id)

  const transform = `translate(${currentOffset?.x || 0}px, ${currentOffset?.y || 0}px)`

  const boxClasses = cx(styles.box, currentOffset != null && styles.visible)
  return (
    <div className={styles.wrapper}>
      <div className={boxClasses} style={{ transform }}>
        {multipleItems ? (
          <>
            <Preview id={id} />
            <Text id={id} /> <div className={styles.multiple}>{count - 1}</div>
          </>
        ) : (
          <>
            <Preview id={id} />
            <Text id={id} />
          </>
        )}
      </div>
    </div>
  )
}
