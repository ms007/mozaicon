import cx from 'clsx'

import styles from './Rectangle.module.css'

const Rectangle = ({ selectable, ...props }) => {
  const classes = cx(selectable && styles.selectable)
  return <rect {...props} className={classes} />
}

export default Rectangle
