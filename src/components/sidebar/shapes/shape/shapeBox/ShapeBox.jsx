import { forwardRef, useMemo } from 'react'
import { useAtomValue } from 'jotai'
import cx from 'clsx'

import { sidebarBoxBorderRadius } from '@/atoms/sidebar'

import styles from './ShapeBox.module.css'

const ShapeBox = forwardRef(({ id, children, dragging, selected, hovered, ...props }, ref) => {
  const borderRadius = useAtomValue(useMemo(() => sidebarBoxBorderRadius(id), [id]))

  const classes = cx(
    styles.box,
    selected && styles.selected,
    hovered && styles.hovered,
    dragging && styles.dragging
  )

  return (
    <div id={id} className={classes} ref={ref} style={borderRadius} {...props}>
      {children}
    </div>
  )
})

export default ShapeBox

ShapeBox.displayName = 'ShapeBox'
