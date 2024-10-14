import { useState, useCallback } from 'react'

import styles from './ScrollBox.module.css'

export default function ScrollBox({ children }) {
  const [top, setTop] = useState(0)

  const measuredRef = useCallback((node) => {
    if (node !== null) {
      setTop(node.getBoundingClientRect().top)
    }
  }, [])

  const style = { maxHeight: `calc(100vh - ${top}px - 20px)` }

  return (
    <div className={styles.box} ref={measuredRef} style={style}>
      {children}
    </div>
  )
}
