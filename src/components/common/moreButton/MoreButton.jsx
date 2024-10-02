import { forwardRef } from 'react'
import cx from 'clsx'

import { MoreIcon } from '../icons'

import styles from './MoreButton.module.css'

const MoreButton = forwardRef((props, ref) => {
  const { active, ...rest } = props
  const classes = cx(styles.button, active && styles.active)

  return (
    <button ref={ref} {...rest} className={classes}>
      <MoreIcon size={28} />
    </button>
  )
})

export default MoreButton

MoreButton.displayName = 'MoreButton'
