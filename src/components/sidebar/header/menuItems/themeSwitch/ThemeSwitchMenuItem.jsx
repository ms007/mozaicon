import { MenuItem, MenuIcon, DropIcon } from '@/components/common'

import { useTheme } from '@/hooks/useTheme'

import styles from './ThemeSwitchMenuItem.module.css'

const Switch = ({ highlighted, text }) => {
  return (
    <div className={styles.box}>
      <MenuIcon highlighted={highlighted}>
        <DropIcon />
      </MenuIcon>
      {text}
    </div>
  )
}

export default function ThemeSwitchMenuItem() {
  const { theme, toggleTheme } = useTheme()
  const text = `Activate ${theme === 'light' ? 'dark' : 'light'} mode`

  return (
    <MenuItem onSelect={toggleTheme}>
      <Switch text={text} />
    </MenuItem>
  )
}
