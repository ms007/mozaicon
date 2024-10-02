import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import styles from './Menu.module.css'

export default function Menu({ renderMenuButton, width = 'auto', align = 'center', children }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{renderMenuButton()}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="bottom"
          sideOffset={5}
          style={{ width }}
          align={align}
          className={styles.content}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
