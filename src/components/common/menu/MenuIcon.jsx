import cx from 'clsx'

import styles from './MenuIcon.module.css'

export default function MenuIcon({ highlighted, children, ...props }) {
  const classes = cx(styles.box, highlighted && styles.highlighted)

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}
