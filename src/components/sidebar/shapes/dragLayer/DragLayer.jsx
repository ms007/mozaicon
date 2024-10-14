import { useDragLayer } from 'react-dnd'
import cx from 'clsx'

import { Text } from '../shape/text'
import { Preview } from '../shape/preview'

import styles from './DragLayer.module.css'

export default function DragLayer() {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getSourceClientOffset(),
  }))

  if (!isDragging) {
    return null
  }

  const { id } = item
  const transform = `translate(${currentOffset?.x || 0}px, ${currentOffset?.y || 0}px)`

  const boxClasses = cx(styles.box, currentOffset != null && styles.visible)
  return (
    <div className={styles.wrapper}>
      <div className={boxClasses} style={{ transform }}>
        <Preview id={id} />
        <Text id={id} />
      </div>
    </div>
  )
}
