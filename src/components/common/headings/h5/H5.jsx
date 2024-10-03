import cx from 'clsx'

import styles from './H5.module.css'

export default function H5({ children, className }) {
  const classes = cx(styles.heading, className)
  return <h5 className={classes}>{children}</h5>
}
