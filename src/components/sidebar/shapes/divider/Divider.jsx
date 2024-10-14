import cx from 'clsx'

import styles from './Divider.module.css'

export default function Divider({ visible }) {
  const classes = cx(styles.box, visible && styles.show)

  return (
    <div className={styles.wrapper}>
      <div className={classes}>
        <div className={styles.circle} />
        <div className={styles.line} />
      </div>
    </div>
  )
}
