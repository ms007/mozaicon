import cx from 'clsx'

import styles from './H4.module.css'

export default function H4({ children, className }) {
  const classes = cx(styles.heading, className)
  return <h4 className={classes}>{children}</h4>
}
