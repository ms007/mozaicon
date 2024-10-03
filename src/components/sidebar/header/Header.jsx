import { forwardRef } from 'react'
import { Logo, Menu, MoreButton } from '@/components/common'
import { ThemeSwitchMenuItem } from './menuItems'

import styles from './Header.module.css'

const MenuButton = forwardRef((props, ref) => {
  const { 'data-state': state } = props
  return <MoreButton ref={ref} active={state === 'open'} {...props} />
})

MenuButton.displayName = 'MenuButton'

export default function Header() {
  return (
    <section className={styles.box}>
      <Logo />
      <div>
        <Menu width="230" align="end" renderMenuButton={() => <MenuButton />}>
          <ThemeSwitchMenuItem />
        </Menu>
      </div>
    </section>
  )
}
