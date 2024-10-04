import cx from 'clsx'

import styles from './ToolButton.module.css'

export default function ToolButton({ selected, children, onClick }) {
  const classes = cx(styles.button, selected && styles.selected)

  const handleClick = (event) => {
    event.stopPropagation()
    onClick()
  }

  return (
    <button className={classes} onClick={handleClick}>
      {children}
    </button>
  )
}
