import { forwardRef, Children, cloneElement, isValidElement } from 'react'
import cx from 'clsx'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import styles from './MenuItem.module.css'

const DropdownMenuItem = forwardRef((props, ref) => {
  const { children, 'data-highlighted': highlighted } = props

  const classes = cx(styles.item, highlighted && styles.highlighted)

  const renderedChildren = Children.map(children, (child) =>
    isValidElement(child)
      ? cloneElement(child, { ...props, highlighted: highlighted != null })
      : child
  )

  return (
    <div ref={ref} className={classes} {...props}>
      {renderedChildren}
    </div>
  )
})

DropdownMenuItem.displayName = 'DropdownMenuItem'

export default function MenuItem({ children, ...props }) {
  return (
    <DropdownMenu.Item asChild {...props}>
      <DropdownMenuItem>{children}</DropdownMenuItem>
    </DropdownMenu.Item>
  )
}
