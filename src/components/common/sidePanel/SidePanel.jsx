import { forwardRef } from 'react'

import styles from './SidePanel.module.css'

const SidePanel = forwardRef(({ children, ...props }, ref) => {
  return (
    <aside className={styles.box} ref={ref} {...props}>
      {children}
    </aside>
  )
})

SidePanel.displayName = 'SidePanel'

export default SidePanel
