import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function EyeOff(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M2 2l10 10" />
      <path d="M4.5 4.5C2.5 5.8 1 7 1 7s2 4 6 4c1 0 1.9-.2 2.7-.6" />
      <path d="M9 9.2A2 2 0 0 1 5 7" />
      <path d="M6.5 3.1A6.5 6.5 0 0 1 13 7s-.5 1-1.5 2" />
    </Icon>
  )
}
