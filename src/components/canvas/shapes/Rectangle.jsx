import cx from 'clsx'

import { Shape } from './Shape'
import styles from './Rectangle.module.css'

const Rectangle = ({ selectable, ...props }) => {
  const classes = cx(selectable && styles.selectable)
  return (
    <Shape {...props}>
      <rect className={classes} />
    </Shape>
  )
}

export default Rectangle
